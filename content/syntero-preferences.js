/*
 * Syntero - Preferences Management
 * Handles preference change detection and serialization
 * 
 * Copyright (c) 2025 YU Shi Jiong
 * Licensed under AGPL-3.0
 */

if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.Preferences = {
	initialized: false,
	observerID: null,
	syncTimeout: null,
	
	/**
	 * Initialize preference listeners
	 */
	init: function() {
		if (this.initialized) {
			return;
		}
		
		try {
			this.setupPreferenceListeners();
			this.initialized = true;
			Zotero.debug('Syntero.Preferences: Initialized');
		} catch (e) {
			Zotero.debug(`Syntero.Preferences: Init error: ${e.message}`);
		}
	},
	
	/**
	 * Setup preference change listeners
	 */
	setupPreferenceListeners: function() {
		try {
			// Register observer for Zotero preferences
			if (Zotero.Prefs && Zotero.Prefs.registerObserver) {
				this.observerID = Zotero.Prefs.registerObserver('', this.onPreferenceChange.bind(this));
			}
			
			// Also monitor system preferences if available
			if (typeof Services !== 'undefined' && Services.prefs) {
				Services.prefs.addObserver('extensions.zotero.', this.onSystemPreferenceChange.bind(this), false);
			}
			
			Zotero.debug('Syntero.Preferences: Listeners set up');
		} catch (e) {
			Zotero.debug(`Syntero.Preferences: Error setting up listeners: ${e.message}`);
		}
	},
	
	/**
	 * Handle Zotero preference changes
	 * NOTE: Auto-upload is disabled - only manual upload is allowed
	 */
	onPreferenceChange: function(prefName, newValue, oldValue) {
		// Ignore changes made during sync
		if (Zotero.Syntero.Sync.isSyncing) {
			return;
		}
		
		// Only log the change, do NOT auto-upload
		Zotero.debug(`Syntero.Preferences: Preference changed: ${prefName} (auto-upload disabled, use manual upload)`);
		
		// Clear any pending timeout (shouldn't be any, but just in case)
		clearTimeout(this.syncTimeout);
		this.syncTimeout = null;
	},
	
	/**
	 * Handle system preference changes
	 * NOTE: Auto-upload is disabled - only manual upload is allowed
	 */
	onSystemPreferenceChange: function(subject, topic, data) {
		if (Zotero.Syntero.Sync.isSyncing) {
			return;
		}
		
		// Only log the change, do NOT auto-upload
		Zotero.debug(`Syntero.Preferences: System preference changed: ${data} (auto-upload disabled, use manual upload)`);
		
		// Clear any pending timeout
		clearTimeout(this.syncTimeout);
		this.syncTimeout = null;
	},
	
	/**
	 * Serialize all preferences to JSON
	 */
	serialize: function() {
		const settings = {
			version: '1.0.0',
			timestamp: new Date().toISOString(),
			deviceId: Zotero.Syntero.Storage.getDeviceId(),
			preferences: {}
		};

		// Get Zotero preferences using known keys
		// Since Zotero.Prefs.getAll() doesn't exist, we use a list of known preferences
		const knownPrefs = this.getKnownPreferenceKeys();
		
		for (const key of knownPrefs) {
			// Skip sensitive or system preferences
			if (this.shouldSkipPreference(key)) {
				continue;
			}
			
			try {
				const prefValue = Zotero.Prefs.get(key);
				if (prefValue !== undefined && prefValue !== null) {
					settings.preferences[key] = prefValue;
				}
			} catch (e) {
				// Preference doesn't exist or can't be read, skip it
				Zotero.debug(`Syntero.Preferences: Skipping preference ${key}: ${e.message}`);
			}
		}

		return JSON.stringify(settings, null, 2);
	},
	
	/**
	 * Get list of known preference keys to sync
	 */
	getKnownPreferenceKeys: function() {
		// List of important Zotero preferences to sync
		// This is a curated list based on common user preferences
		const keys = [
			// Export settings
			'export.quickCopy.setting',
			'export.quickCopy.defaultFormat',
			'export.quickCopy.citeCommand',
			'export.quickCopy.citeCommandFormat',
			'export.quickCopy.citeCommandURL',
			'export.quickCopy.citeCommandDOI',
			'export.quickCopy.citeCommandPandoc',
			'export.quickCopy.citeCommandPandocFormat',
			
			// Display settings
			'display.dateFormat',
			'display.dateFormat.date',
			'display.dateFormat.time',
			'display.dateFormat.local',
			'display.dateFormat.seconds',
			'display.dateFormat.weekday',
			'display.dateFormat.year',
			'display.dateFormat.month',
			'display.dateFormat.day',
			
			// Editor settings
			'editor.fontSize',
			'editor.fontFamily',
			'editor.spellcheck',
			'editor.wordWrap',
			
			// General settings
			'general.openURL',
			'general.openPDF',
			'general.autoOpenNote',
			'general.autoOpenAttachment',
			
			// Search settings
			'search.fulltext',
			'search.titleCreatorYear',
			
			// Sync settings (but not credentials)
			'sync.server.username',
			// Note: We skip sync.server.password and sync.server.passphrase for security
			
			// Advanced settings
			'advanced.export.includeAttachmentFiles',
			'advanced.export.includeAttachmentLinks',
			'advanced.export.includeNotes',
			'advanced.export.includeTags',
			'advanced.export.includeRelated',
			
			// Citation settings
			'cite.citeCommand',
			'cite.citeCommandFormat',
			'cite.citeCommandURL',
			'cite.citeCommandDOI',
			
			// Note settings
			'note.fontSize',
			'note.fontFamily',
			'note.spellcheck',
			'note.wordWrap',
			
			// Collection settings
			'collections.warnOnEmptyTrash',
			'collections.warnOnDelete',
			
			// Tag settings
			'tags.autocomplete',
			'tags.showAutomatic',
			
			// Other useful settings
			'lastSelectedPrefPane',
			'lastSelectedLibrary',
			'lastSelectedCollection',
		];
		
		// Also try to get preferences from Services.prefs for extensions.zotero.*
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			const branch = Services.prefs.getBranch('extensions.zotero.');
			const children = branch.getChildList('');
			
			for (const child of children) {
				const fullKey = 'extensions.zotero.' + child;
				// Only add if not already in list and not sensitive
				if (!keys.includes(fullKey) && !this.shouldSkipPreference(fullKey)) {
					keys.push(fullKey);
				}
			}
		} catch (e) {
			Zotero.debug(`Syntero.Preferences: Could not enumerate extensions.zotero preferences: ${e.message}`);
		}
		
		return keys;
	},
	
	/**
	 * Deserialize and apply preferences from JSON
	 * @param {string} jsonString - JSON string containing settings
	 * @param {boolean} forceApply - If true, apply settings even if from same device or not newer
	 */
	deserialize: function(jsonString, forceApply = false) {
		try {
			const settings = JSON.parse(jsonString);
			
			if (!settings.preferences || !settings.timestamp) {
				throw new Error('Invalid settings format');
			}

			// Check if this is from a different device (only skip if not forcing)
			if (!forceApply && settings.deviceId === Zotero.Syntero.Storage.getDeviceId()) {
				Zotero.debug('Syntero.Preferences: Settings from same device, skipping');
				return false;
			}

			// Check timestamp (only skip if not forcing)
			if (!forceApply) {
				const lastSyncTime = Zotero.Prefs.get('extensions.syntero.lastSyncTime');
				if (lastSyncTime && new Date(settings.timestamp) <= new Date(lastSyncTime)) {
					Zotero.debug('Syntero.Preferences: Settings are not newer, skipping');
					return false;
				}
			}

			Zotero.Syntero.Sync.isSyncing = true;
			
			// Apply preferences
			let appliedCount = 0;
			for (const [key, value] of Object.entries(settings.preferences)) {
				try {
					Zotero.Prefs.set(key, value);
					appliedCount++;
				} catch (e) {
					Zotero.debug(`Syntero.Preferences: Error applying preference ${key}: ${e.message}`);
				}
			}

			Zotero.Prefs.set('extensions.syntero.lastSyncTime', settings.timestamp);
			Zotero.Syntero.Sync.isSyncing = false;
			
			Zotero.debug(`Syntero.Preferences: Applied ${appliedCount} preferences from sync`);
			
			Zotero.Syntero.UI.showNotification(
				'Settings synchronized',
				`Applied ${appliedCount} settings from ${new Date(settings.timestamp).toLocaleString()}`
			);
			
			return true;
		} catch (e) {
			Zotero.debug(`Syntero.Preferences: Error deserializing: ${e.message}`);
			Zotero.Syntero.Sync.isSyncing = false;
			return false;
		}
	},
	
	/**
	 * Check if preference should be skipped
	 */
	shouldSkipPreference: function(key) {
		const skipPatterns = [
			'apiKey',
			'password',
			'token',
			'secret',
			'sync.username',
			'sync.password',
			'lastSync',
			'lastSync.time',
			'extensions.syntero' // Skip our own preferences
		];
		
		return skipPatterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()));
	},
	
	/**
	 * Shutdown preference listeners
	 */
	shutdown: function() {
		if (this.observerID !== null) {
			try {
				Zotero.Prefs.unregisterObserver(this.observerID);
			} catch (e) {
				// Ignore
			}
			this.observerID = null;
		}
		
		if (this.syncTimeout) {
			clearTimeout(this.syncTimeout);
			this.syncTimeout = null;
		}
		
		this.initialized = false;
	}
};

