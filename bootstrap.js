/*
 * Syntero - Zotero Settings Sync Plugin
 * Bootstrap file for Zotero 7+
 * Based on Zotero sample plugin structure
 * 
 * Copyright (c) 2025 YU Shi Jiong
 * Licensed under AGPL-3.0
 */

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

// Plugin initialization
async function startup({ id, version, rootURI }) {
	Services.obs.notifyObservers({wrappedJSObject: {id, version, rootURI}}, 'syntero-startup');
	
	try {
		// Convert rootURI to proper file path
		let scriptPath;
		if (rootURI.startsWith('chrome://')) {
			// Chrome URI - convert to file path
			const uri = Services.io.newURI(rootURI);
			scriptPath = uri.path;
		} else if (rootURI.startsWith('file://')) {
			// File URI
			const uri = Services.io.newURI(rootURI);
			scriptPath = uri.path;
		} else {
			// Assume it's already a path
			scriptPath = rootURI;
		}
		
		// Ensure path ends with /
		if (!scriptPath.endsWith('/')) {
			scriptPath += '/';
		}
		
		Services.console.logStringMessage(`Syntero: Loading scripts from ${scriptPath}`);
		
		// Load plugin modules in order
		// Use try-catch for each to identify which file fails
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/include.js', {});
			Services.console.logStringMessage('Syntero: include.js loaded');
		} catch (e) {
			throw new Error(`Failed to load include.js: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-core.js', {});
			Services.console.logStringMessage('Syntero: syntero-core.js loaded');
		} catch (e) {
			throw new Error(`Failed to load syntero-core.js: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-preferences.js', {});
			Services.console.logStringMessage('Syntero: syntero-preferences.js loaded');
		} catch (e) {
			throw new Error(`Failed to load syntero-preferences.js: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-storage.js', {});
			Services.console.logStringMessage('Syntero: syntero-storage.js loaded');
		} catch (e) {
			throw new Error(`Failed to load syntero-storage.js: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-sync.js', {});
			Services.console.logStringMessage('Syntero: syntero-sync.js loaded');
		} catch (e) {
			throw new Error(`Failed to load syntero-sync.js: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-ui.js', {});
			Services.console.logStringMessage('Syntero: syntero-ui.js loaded');
		} catch (e) {
			throw new Error(`Failed to load syntero-ui.js: ${e.message}`);
		}
		
		// Check if namespace exists
		if (typeof Zotero === 'undefined' || typeof Zotero.Syntero === 'undefined') {
			throw new Error('Zotero.Syntero namespace not found after loading scripts');
		}
		
		// Initialize plugin
		if (typeof Zotero.Syntero.Core === 'undefined' || typeof Zotero.Syntero.Core.init !== 'function') {
			throw new Error('Zotero.Syntero.Core.init not found');
		}
		
		Zotero.Syntero.Core.init(rootURI);
		
		Services.console.logStringMessage('Syntero: Plugin loaded and initialized successfully');
	} catch (e) {
		const errorMsg = e.message || String(e);
		const errorStack = e.stack || 'No stack trace available';
		Services.console.logStringMessage(`Syntero startup error: ${errorMsg}`);
		Services.console.logStringMessage(`Syntero stack: ${errorStack}`);
		Services.console.logStringMessage(`Syntero rootURI: ${rootURI}`);
	}
}

async function shutdown({ id, reason }) {
	try {
		if (Zotero.Syntero && Zotero.Syntero.Core) {
			Zotero.Syntero.Core.shutdown();
		}
	} catch (e) {
		Services.console.logStringMessage(`Syntero shutdown error: ${e.message}`);
	}
	Services.obs.notifyObservers({wrappedJSObject: {id, reason}}, 'syntero-shutdown');
}

function install({ id, version, reason }) {
	// Plugin installation logic
}

function uninstall({ id, reason }) {
	// Plugin uninstallation logic
}

