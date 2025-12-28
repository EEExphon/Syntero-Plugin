// 偏好管理
if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.Preferences = {
	initialized: false,
	observerID: null,
	syncTimeout: null,
	
	init: function() {
		if (this.initialized) {
			return;
		}
		
		try {
			this.setupPreferenceListeners();
			this.initialized = true;
			Zotero.debug('Syntero.Preferences: 已初始化');
		} catch (e) {
			Zotero.debug(`Syntero.Preferences: 初始化错误: ${e.message}`);
		}
	},
	
	setupPreferenceListeners: function() {
		try {
			if (Zotero.Prefs && Zotero.Prefs.registerObserver) {
				this.observerID = Zotero.Prefs.registerObserver('', this.onPreferenceChange.bind(this));
			}
			
			if (typeof Services !== 'undefined' && Services.prefs) {
				Services.prefs.addObserver('extensions.zotero.', this.onSystemPreferenceChange.bind(this), false);
			}
			
			Zotero.debug('Syntero.Preferences: 监听器已设置');
		} catch (e) {
			Zotero.debug(`Syntero.Preferences: 设置监听器错误: ${e.message}`);
		}
	},
	
	// 注意：自动上传已禁用，仅允许手动上传
	onPreferenceChange: function(prefName, newValue, oldValue) {
		if (Zotero.Syntero.Sync.isSyncing) {
			return;
		}
		
		Zotero.debug(`Syntero.Preferences: 偏好已更改: ${prefName} (自动上传已禁用，请使用手动上传)`);
		
		clearTimeout(this.syncTimeout);
		this.syncTimeout = null;
	},
	
	onSystemPreferenceChange: function(subject, topic, data) {
		if (Zotero.Syntero.Sync.isSyncing) {
			return;
		}
		
		Zotero.debug(`Syntero.Preferences: 系统偏好已更改: ${data} (自动上传已禁用，请使用手动上传)`);
		
		clearTimeout(this.syncTimeout);
		this.syncTimeout = null;
	},
	
	serialize: function() {
		const settings = {
			version: '1.0.0',
			timestamp: new Date().toISOString(),
			deviceId: Zotero.Syntero.Storage.getDeviceId(),
			preferences: {}
		};

		const knownPrefs = this.getKnownPreferenceKeys();
		
		for (const key of knownPrefs) {
			if (this.shouldSkipPreference(key)) {
				continue;
			}
			
			try {
				const prefValue = Zotero.Prefs.get(key);
				if (prefValue !== undefined && prefValue !== null) {
					settings.preferences[key] = prefValue;
				}
			} catch (e) {
				Zotero.debug(`Syntero.Preferences: 跳过偏好 ${key}: ${e.message}`);
			}
		}

		return JSON.stringify(settings, null, 2);
	},
	
	getKnownPreferenceKeys: function() {
		// 要同步的重要Zotero偏好列表
		const keys = [
			// 导出设置
			'export.quickCopy.setting',
			'export.quickCopy.defaultFormat',
			'export.quickCopy.citeCommand',
			'export.quickCopy.citeCommandFormat',
			'export.quickCopy.citeCommandURL',
			'export.quickCopy.citeCommandDOI',
			'export.quickCopy.citeCommandPandoc',
			'export.quickCopy.citeCommandPandocFormat',
			
			// 显示设置
			'display.dateFormat',
			'display.dateFormat.date',
			'display.dateFormat.time',
			'display.dateFormat.local',
			'display.dateFormat.seconds',
			'display.dateFormat.weekday',
			'display.dateFormat.year',
			'display.dateFormat.month',
			'display.dateFormat.day',
			
			// 编辑器设置
			'editor.fontSize',
			'editor.fontFamily',
			'editor.spellcheck',
			'editor.wordWrap',
			
			// 常规设置
			'general.openURL',
			'general.openPDF',
			'general.autoOpenNote',
			'general.autoOpenAttachment',
			
			// 搜索设置
			'search.fulltext',
			'search.titleCreatorYear',
			
			// 同步设置（但不包括凭据）
			'sync.server.username',
			
			// 高级设置
			'advanced.export.includeAttachmentFiles',
			'advanced.export.includeAttachmentLinks',
			'advanced.export.includeNotes',
			'advanced.export.includeTags',
			'advanced.export.includeRelated',
			
			// 引用设置
			'cite.citeCommand',
			'cite.citeCommandFormat',
			'cite.citeCommandURL',
			'cite.citeCommandDOI',
			
			// 笔记设置
			'note.fontSize',
			'note.fontFamily',
			'note.spellcheck',
			'note.wordWrap',
			
			// 集合设置
			'collections.warnOnEmptyTrash',
			'collections.warnOnDelete',
			
			// 标签设置
			'tags.autocomplete',
			'tags.showAutomatic',
			
			// 其他有用设置
			'lastSelectedPrefPane',
			'lastSelectedLibrary',
			'lastSelectedCollection',
		];
		
		// 也尝试从Services.prefs获取extensions.zotero.*的偏好
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			const branch = Services.prefs.getBranch('extensions.zotero.');
			const children = branch.getChildList('');
			
			for (const child of children) {
				const fullKey = 'extensions.zotero.' + child;
				if (!keys.includes(fullKey) && !this.shouldSkipPreference(fullKey)) {
					keys.push(fullKey);
				}
			}
		} catch (e) {
			Zotero.debug(`Syntero.Preferences: 无法枚举 extensions.zotero 偏好: ${e.message}`);
		}
		
		return keys;
	},
	
	deserialize: function(jsonString, forceApply = false) {
		try {
			const settings = JSON.parse(jsonString);
			
			if (!settings.preferences || !settings.timestamp) {
				throw new Error('无效的设置格式');
			}

			if (!forceApply && settings.deviceId === Zotero.Syntero.Storage.getDeviceId()) {
				Zotero.debug('Syntero.Preferences: 来自同一设备的设置，跳过');
				return false;
			}

			if (!forceApply) {
				const lastSyncTime = Zotero.Prefs.get('extensions.syntero.lastSyncTime');
				if (lastSyncTime && new Date(settings.timestamp) <= new Date(lastSyncTime)) {
					Zotero.debug('Syntero.Preferences: 设置不是更新的，跳过');
					return false;
				}
			}

			Zotero.Syntero.Sync.isSyncing = true;
			
			let appliedCount = 0;
			const changes = [];
			for (const [key, value] of Object.entries(settings.preferences)) {
				try {
					const oldValue = Zotero.Prefs.get(key);
					Zotero.Prefs.set(key, value);
					appliedCount++;
					
					if (oldValue !== value) {
						changes.push({
							key: key,
							oldValue: oldValue,
							newValue: value
						});
					}
				} catch (e) {
					Zotero.debug(`Syntero.Preferences: 应用偏好 ${key} 错误: ${e.message}`);
				}
			}

			Zotero.Prefs.set('extensions.syntero.lastSyncTime', settings.timestamp);
			Zotero.Syntero.Sync.isSyncing = false;
			
			Zotero.debug(`Syntero.Preferences: 从同步应用了 ${appliedCount} 个偏好`);
			
			return {
				success: true,
				appliedCount: appliedCount,
				changes: changes,
				timestamp: settings.timestamp
			};
		} catch (e) {
			Zotero.debug(`Syntero.Preferences: 反序列化错误: ${e.message}`);
			Zotero.Syntero.Sync.isSyncing = false;
			return {
				success: false,
				error: e.message,
				appliedCount: 0,
				changes: []
			};
		}
	},
	
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
			'extensions.syntero'
		];
		
		return skipPatterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()));
	},
	
	shutdown: function() {
		if (this.observerID !== null) {
			try {
				Zotero.Prefs.unregisterObserver(this.observerID);
			} catch (e) {
				// 忽略
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
