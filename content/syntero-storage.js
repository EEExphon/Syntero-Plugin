// 存储管理 - 使用Zotero Items API处理云存储
if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.Storage = {
	configFileName: 'syntero-config.json',
	configItemKey: null,
	
	getDeviceId: function() {
		let deviceId = Zotero.Prefs.get('extensions.syntero.deviceId');
		if (!deviceId) {
			deviceId = Zotero.Utilities.randomString(16);
			Zotero.Prefs.set('extensions.syntero.deviceId', deviceId);
		}
		return deviceId;
	},
	
	findConfigItem: async function() {
		if (this.configItemKey) {
			try {
				const item = await Zotero.Items.getAsync(
					Zotero.Libraries.userLibraryID,
					this.configItemKey
				);
				if (item.itemType === 'note') {
					Zotero.debug('Syntero.Storage: 找到旧的note类型配置项，将重新创建');
					await item.eraseTx();
					this.configItemKey = null;
				} else {
					return item;
				}
			} catch (e) {
				this.configItemKey = null;
			}
		}

		const s = new Zotero.Search();
		s.addCondition('tag', 'is', 'SynteroConfig');
		s.addCondition('libraryID', 'is', Zotero.Libraries.userLibraryID);
		const results = await s.search();
		
		if (results.length > 0) {
			const item = await Zotero.Items.getAsync(results[0]);
			if (item.itemType === 'note') {
				Zotero.debug('Syntero.Storage: 找到旧的note类型配置项，删除并重新创建');
				await item.eraseTx();
				this.configItemKey = null;
				return null;
			}
			this.configItemKey = item.key;
			return item;
		}

		return null;
	},
	
	// 使用'document'类型而不是'note'，因为附件需要常规项作为父项
	createConfigItem: async function() {
		const configItem = new Zotero.Item('document');
		configItem.setField('title', 'Syntero Settings Sync Configuration');
		configItem.setField('abstractNote', 'This item is automatically managed by the Syntero plugin. It stores the settings synchronization configuration file. Do not modify manually.');
		configItem.addTag('SynteroConfig');
		await configItem.saveTx();
		this.configItemKey = configItem.key;
		return configItem;
	},
	
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
	
	createTempConfigFile: async function(content) {
		const file = Zotero.getTempDirectory();
		file.append(this.configFileName);
		await Zotero.File.putContentsAsync(file, content);
		return file;
	},
	
	upload: async function(settingsJSON) {
		try {
			let configItem = await this.findConfigItem();
			if (!configItem) {
				configItem = await this.createConfigItem();
			}

			let attachment = await this.findConfigAttachment(configItem);
			const tempFile = await this.createTempConfigFile(settingsJSON);
			
			if (!attachment) {
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
					Zotero.debug(`Syntero.Storage: 创建附件错误: ${e.message}`);
					throw new Error(`创建附件失败: ${e.message}`);
				}
			} else {
				try {
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
					Zotero.debug(`Syntero.Storage: 更新附件错误: ${e.message}`);
					throw new Error(`更新附件失败: ${e.message}`);
				}
			}

			// 触发同步
			try {
				if (Zotero.Sync && Zotero.Sync.Runner) {
					Zotero.Sync.Runner.sync();
				} else if (Zotero.Sync && Zotero.Sync.uploader) {
					Zotero.Sync.uploader.sync();
				}
			} catch (e) {
				// Zotero会自动同步
			}
			
			Zotero.debug('Syntero.Storage: 设置上传成功');
			return true;
			
		} catch (e) {
			Zotero.debug(`Syntero.Storage: 上传错误: ${e.message}`);
			throw e;
		}
	},
	
	download: async function() {
		try {
			const configItem = await this.findConfigItem();
			if (!configItem) {
				Zotero.debug('Syntero.Storage: 未找到配置项');
				return null;
			}

			const attachment = await this.findConfigAttachment(configItem);
			if (!attachment) {
				Zotero.debug('Syntero.Storage: 未找到配置附件');
				return null;
			}

			let filePath;
			try {
				filePath = await attachment.getFilePathAsync();
			} catch (e) {
				filePath = attachment.getFilePath();
			}
			
			if (!filePath) {
				Zotero.debug('Syntero.Storage: 无法获取文件路径');
				return null;
			}

			const content = await Zotero.File.getContentsAsync(filePath);
			return content;
			
		} catch (e) {
			Zotero.debug(`Syntero.Storage: 下载错误: ${e.message}`);
			return null;
		}
	}
};
