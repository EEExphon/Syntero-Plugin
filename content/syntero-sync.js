// 同步管理
if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.Sync = {
	initialized: false,
	syncInterval: null,
	isSyncing: false,
	lastSyncTime: null,
	
	init: function() {
		if (this.initialized) {
			return;
		}
		
		try {
			this.setupSyncScheduler();
			this.initialized = true;
			Zotero.debug('Syntero.Sync: 已初始化');
			
			setTimeout(() => {
				this.checkForUpdates();
			}, 5000);
		} catch (e) {
			Zotero.debug(`Syntero.Sync: 初始化错误: ${e.message}`);
		}
	},
	
	// 注意：自动下载已移除，所有同步都是手动的
	setupSyncScheduler: function() {
		Zotero.debug('Syntero.Sync: 所有同步都是手动的（自动下载已移除）');
	},
	
	uploadSettings: async function() {
		if (this.isSyncing) {
			Zotero.debug('Syntero.Sync: 正在同步，跳过上传');
			return;
		}
		
		try {
			this.isSyncing = true;
			const settingsJSON = Zotero.Syntero.Preferences.serialize();
			const settings = JSON.parse(settingsJSON);
			await Zotero.Syntero.Storage.upload(settingsJSON);
			
			this.lastSyncTime = new Date().toISOString();
			Zotero.Prefs.set('extensions.syntero.lastSyncTime', this.lastSyncTime);
			
			Zotero.Syntero.UI.updateSyncStatus('最后同步: ' + new Date().toLocaleString());
			Zotero.debug('Syntero.Sync: 设置上传成功');
			
			return {
				success: true,
				settings: settings
			};
			
		} catch (e) {
			Zotero.debug(`Syntero.Sync: 上传错误: ${e.message}`);
			Zotero.Syntero.UI.showNotification('同步错误', `上传设置失败: ${e.message}`, 'error');
			throw e;
		} finally {
			this.isSyncing = false;
		}
	},
	
	checkForUpdates: async function(forceApply = false) {
		if (this.isSyncing) {
			Zotero.debug('Syntero.Sync: 正在同步，跳过');
			return;
		}
		
		try {
			this.isSyncing = true;
			const content = await Zotero.Syntero.Storage.download();
			if (content) {
				const result = Zotero.Syntero.Preferences.deserialize(content, forceApply);
				if (result && result.success) {
					this.lastSyncTime = new Date().toISOString();
					Zotero.Prefs.set('extensions.syntero.lastSyncTime', this.lastSyncTime);
					Zotero.Syntero.UI.updateSyncStatus('最后同步: ' + new Date().toLocaleString());
					Zotero.debug('Syntero.Sync: 设置下载并应用成功');
					return result;
				} else {
					if (forceApply) {
						Zotero.debug('Syntero.Sync: 请求强制应用但反序列化返回false');
						throw new Error(result?.error || '应用设置失败');
					} else {
						Zotero.debug('Syntero.Sync: 没有新设置要应用');
						return null;
					}
				}
			} else {
				Zotero.debug('Syntero.Sync: 云端未找到设置文件');
				if (forceApply) {
					throw new Error('云端未找到设置文件');
				}
				return null;
			}
		} catch (e) {
			Zotero.debug(`Syntero.Sync: 检查更新错误: ${e.message}`);
			throw e;
		} finally {
			this.isSyncing = false;
		}
	},
	
	syncNow: async function() {
		return await this.checkForUpdates();
	},
	
	shutdown: function() {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
			this.syncInterval = null;
		}
		
		this.isSyncing = false;
		this.initialized = false;
	}
};
