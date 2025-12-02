/*
 * Syntero - Sync Management
 * Handles synchronization scheduling and coordination
 * 
 * Copyright (c) 2025 YU Shi Jiong
 * Licensed under AGPL-3.0
 */

if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.Sync = {
	initialized: false,
	syncInterval: null,
	isSyncing: false,
	lastSyncTime: null,
	
	/**
	 * Initialize sync scheduler
	 */
	init: function() {
		if (this.initialized) {
			return;
		}
		
		try {
			this.setupSyncScheduler();
			this.initialized = true;
			Zotero.debug('Syntero.Sync: Initialized');
			
			// Initial sync check
			setTimeout(() => {
				this.checkForUpdates();
			}, 5000); // Wait 5 seconds after startup
		} catch (e) {
			Zotero.debug(`Syntero.Sync: Init error: ${e.message}`);
		}
	},
	
	/**
	 * Setup sync scheduler
	 * NOTE: Only automatic download checking is enabled, upload is always manual
	 */
	setupSyncScheduler: function() {
		const autoDownload = Zotero.Prefs.get('extensions.syntero.autoDownload', true);
		
		if (autoDownload) {
			// Check for updates every 5 minutes (download only, no auto-upload)
			this.syncInterval = setInterval(() => {
				this.checkForUpdates();
			}, 5 * 60 * 1000);
			
			Zotero.debug('Syntero.Sync: Auto-download enabled, checking every 5 minutes (upload is manual only)');
		} else {
			Zotero.debug('Syntero.Sync: Auto-download disabled (all sync is manual)');
		}
		
		// Listen for preference changes
		Zotero.Prefs.registerObserver('extensions.syntero.autoDownload', (prefName, newValue) => {
			if (newValue && !this.syncInterval) {
				this.setupSyncScheduler();
			} else if (!newValue && this.syncInterval) {
				clearInterval(this.syncInterval);
				this.syncInterval = null;
			}
		});
	},
	
	/**
	 * Upload current settings
	 */
	uploadSettings: async function() {
		if (this.isSyncing) {
			Zotero.debug('Syntero.Sync: Already syncing, skipping upload');
			return;
		}
		
		try {
			this.isSyncing = true;
			const settingsJSON = Zotero.Syntero.Preferences.serialize();
			await Zotero.Syntero.Storage.upload(settingsJSON);
			
			this.lastSyncTime = new Date().toISOString();
			Zotero.Prefs.set('extensions.syntero.lastSyncTime', this.lastSyncTime);
			
			Zotero.Syntero.UI.updateSyncStatus('Last synced: ' + new Date().toLocaleString());
			Zotero.debug('Syntero.Sync: Settings uploaded successfully');
			
		} catch (e) {
			Zotero.debug(`Syntero.Sync: Upload error: ${e.message}`);
			Zotero.Syntero.UI.showNotification('Sync Error', `Failed to upload settings: ${e.message}`, 'error');
		} finally {
			this.isSyncing = false;
		}
	},
	
	/**
	 * Check for updates and apply them (Sync - download and apply)
	 * @param {boolean} forceApply - Force apply settings even if from same device
	 */
	checkForUpdates: async function(forceApply = false) {
		if (this.isSyncing) {
			Zotero.debug('Syntero.Sync: Already syncing, skipping');
			return;
		}
		
		try {
			this.isSyncing = true;
			const content = await Zotero.Syntero.Storage.download();
			if (content) {
				// Force apply when user explicitly clicks Sync button
				const applied = Zotero.Syntero.Preferences.deserialize(content, forceApply);
				if (applied) {
					this.lastSyncTime = new Date().toISOString();
					Zotero.Prefs.set('extensions.syntero.lastSyncTime', this.lastSyncTime);
					Zotero.Syntero.UI.updateSyncStatus('Last synced: ' + new Date().toLocaleString());
					Zotero.debug('Syntero.Sync: Settings downloaded and applied successfully');
				} else {
					if (forceApply) {
						Zotero.debug('Syntero.Sync: Force apply requested but deserialize returned false');
						throw new Error('Failed to apply settings');
					} else {
						Zotero.debug('Syntero.Sync: No new settings to apply');
					}
				}
			} else {
				Zotero.debug('Syntero.Sync: No settings file found in cloud');
				if (forceApply) {
					throw new Error('No settings file found in cloud');
				}
			}
		} catch (e) {
			Zotero.debug(`Syntero.Sync: Check for updates error: ${e.message}`);
			throw e;
		} finally {
			this.isSyncing = false;
		}
	},
	
	/**
	 * Sync (download and apply) - replaces current settings with cloud settings
	 * This is the "Sync" button functionality
	 */
	syncNow: async function() {
		// Sync now means download and apply (same as checkForUpdates)
		return await this.checkForUpdates();
	},
	
	/**
	 * Shutdown sync scheduler
	 */
	shutdown: function() {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
			this.syncInterval = null;
		}
		
		this.isSyncing = false;
		this.initialized = false;
	}
};

