/*
 * Syntero - Storage Management
 * Handles cloud storage using Zotero Items API
 * 
 * Copyright (c) 2025 YU Shi Jiong
 * Licensed under AGPL-3.0
 */

if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.Storage = {
	configFileName: 'syntero-config.json',
	configItemKey: null,
	
	/**
	 * Get or create device ID
	 */
	getDeviceId: function() {
		let deviceId = Zotero.Prefs.get('extensions.syntero.deviceId');
		if (!deviceId) {
			deviceId = Zotero.Utilities.randomString(16);
			Zotero.Prefs.set('extensions.syntero.deviceId', deviceId);
		}
		return deviceId;
	},
	
	/**
	 * Find or create config item
	 */
	findConfigItem: async function() {
		if (this.configItemKey) {
			try {
				const item = await Zotero.Items.getAsync(
					Zotero.Libraries.userLibraryID,
					this.configItemKey
				);
				// Check if item type is valid (must be regular item, not note)
				if (item.itemType === 'note') {
					Zotero.debug('Syntero.Storage: Found old note-type config item, will recreate');
					// Delete old note item
					await item.eraseTx();
					this.configItemKey = null;
				} else {
					return item;
				}
			} catch (e) {
				this.configItemKey = null;
			}
		}

		// Search for existing config item by tag
		const s = new Zotero.Search();
		s.addCondition('tag', 'is', 'SynteroConfig');
		s.addCondition('libraryID', 'is', Zotero.Libraries.userLibraryID);
		const results = await s.search();
		
		if (results.length > 0) {
			const item = await Zotero.Items.getAsync(results[0]);
			// Check if item type is valid
			if (item.itemType === 'note') {
				Zotero.debug('Syntero.Storage: Found old note-type config item, deleting and recreating');
				// Delete old note item
				await item.eraseTx();
				this.configItemKey = null;
				return null;
			}
			this.configItemKey = item.key;
			return item;
		}

		return null;
	},
	
	/**
	 * Create config item
	 * Use 'document' type instead of 'note' because attachments require a regular item as parent
	 */
	createConfigItem: async function() {
		const configItem = new Zotero.Item('document');
		configItem.setField('title', 'Syntero Settings Sync Configuration');
		configItem.setField('abstractNote', 'This item is automatically managed by the Syntero plugin. It stores the settings synchronization configuration file. Do not modify manually.');
		configItem.addTag('SynteroConfig');
		await configItem.saveTx();
		this.configItemKey = configItem.key;
		return configItem;
	},
	
	/**
	 * Find config attachment
	 */
	findConfigAttachment: async function(parentItem) {
		const attachments = parentItem.getAttachments();
		
		for (const attID of attachments) {
			const att = await Zotero.Items.getAsync(attID);
			const filename = att.attachmentFilename || att.getField('title');
			if (filename === this.configFileName) {
				return att;
			}
		}

		return null;
	},
	
	/**
	 * Create temporary config file
	 */
	createTempConfigFile: async function(content) {
		const file = Zotero.getTempDirectory();
		file.append(this.configFileName);
		await Zotero.File.putContentsAsync(file, content);
		return file;
	},
	
	/**
	 * Upload settings to cloud
	 */
	upload: async function(settingsJSON) {
		try {
			// Find or create config item
			let configItem = await this.findConfigItem();
			if (!configItem) {
				configItem = await this.createConfigItem();
			}

			// Create or update attachment
			let attachment = await this.findConfigAttachment(configItem);
			const tempFile = await this.createTempConfigFile(settingsJSON);
			
			if (!attachment) {
				// Create new attachment using Zotero.Attachments API
				try {
					attachment = await Zotero.Attachments.importFromFile({
						file: tempFile,
						parentItemID: configItem.id
					});
					if (attachment) {
						attachment.setField('title', this.configFileName);
						await attachment.saveTx();
					}
				} catch (e) {
					Zotero.debug(`Syntero.Storage: Error creating attachment: ${e.message}`);
					throw new Error(`Failed to create attachment: ${e.message}`);
				}
			} else {
				// Update existing attachment by replacing the file
				try {
					// Delete old attachment and create new one
					await attachment.eraseTx();
					attachment = await Zotero.Attachments.importFromFile({
						file: tempFile,
						parentItemID: configItem.id
					});
					if (attachment) {
						attachment.setField('title', this.configFileName);
						await attachment.saveTx();
					}
				} catch (e) {
					Zotero.debug(`Syntero.Storage: Error updating attachment: ${e.message}`);
					throw new Error(`Failed to update attachment: ${e.message}`);
				}
			}

			// Trigger sync
			try {
				if (Zotero.Sync && Zotero.Sync.Runner) {
					Zotero.Sync.Runner.sync();
				} else if (Zotero.Sync && Zotero.Sync.uploader) {
					Zotero.Sync.uploader.sync();
				}
			} catch (e) {
				// Zotero will sync automatically
			}
			
			Zotero.debug('Syntero.Storage: Settings uploaded successfully');
			return true;
			
		} catch (e) {
			Zotero.debug(`Syntero.Storage: Upload error: ${e.message}`);
			throw e;
		}
	},
	
	/**
	 * Download settings from cloud
	 */
	download: async function() {
		try {
			const configItem = await this.findConfigItem();
			if (!configItem) {
				Zotero.debug('Syntero.Storage: No config item found');
				return null;
			}

			const attachment = await this.findConfigAttachment(configItem);
			if (!attachment) {
				Zotero.debug('Syntero.Storage: No config attachment found');
				return null;
			}

			// Get file path
			let filePath;
			try {
				filePath = await attachment.getFilePathAsync();
			} catch (e) {
				filePath = attachment.getFilePath();
			}
			
			if (!filePath) {
				Zotero.debug('Syntero.Storage: Could not get file path');
				return null;
			}

			// Read file content
			const content = await Zotero.File.getContentsAsync(filePath);
			return content;
			
		} catch (e) {
			Zotero.debug(`Syntero.Storage: Download error: ${e.message}`);
			return null;
		}
	}
};

