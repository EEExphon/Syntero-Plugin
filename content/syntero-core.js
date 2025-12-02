/*
 * Syntero - Core Plugin Logic
 * Main plugin initialization and coordination
 * 
 * Copyright (c) 2025 YU Shi Jiong
 * Licensed under AGPL-3.0
 */

// Ensure namespace exists
if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.Core = {
	initialized: false,
	rootURI: null,
	
	/**
	 * Initialize the plugin
	 */
	init: function(rootURI) {
		if (this.initialized) {
			Zotero.debug('Syntero: Already initialized');
			return;
		}
		
		this.rootURI = rootURI;
		
		try {
			// Initialize components in order
			Zotero.Syntero.Preferences.init();
			Zotero.Syntero.Sync.init();
			Zotero.Syntero.UI.init();
			
			this.initialized = true;
			Zotero.debug('Syntero: Plugin initialized successfully');
			Zotero.debug('Syntero: Upload mode is MANUAL ONLY - settings will not auto-upload');
		} catch (e) {
			Zotero.debug(`Syntero: Initialization error: ${e.message}`);
			Zotero.debug(`Syntero: Stack: ${e.stack}`);
		}
	},
	
	/**
	 * Shutdown the plugin
	 */
	shutdown: function() {
		if (!this.initialized) {
			return;
		}
		
		try {
			Zotero.Syntero.Sync.shutdown();
			Zotero.Syntero.UI.shutdown();
			Zotero.Syntero.Preferences.shutdown();
			
			this.initialized = false;
			Zotero.debug('Syntero: Plugin shutdown complete');
		} catch (e) {
			Zotero.debug(`Syntero: Shutdown error: ${e.message}`);
		}
	}
};

