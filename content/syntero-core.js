// 核心插件逻辑
if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.Core = {
	initialized: false,
	rootURI: null,
	
	init: function(rootURI) {
		if (this.initialized) {
			Zotero.debug('Syntero: 已初始化');
			return;
		}
		
		this.rootURI = rootURI;
		
		try {
			Zotero.Syntero.Preferences.init();
			Zotero.Syntero.Sync.init();
			Zotero.Syntero.UI.init();
			
			this.initialized = true;
			Zotero.debug('Syntero: 插件初始化成功');
			Zotero.debug('Syntero: 上传模式为仅手动 - 设置不会自动上传');
		} catch (e) {
			Zotero.debug(`Syntero: 初始化错误: ${e.message}`);
			Zotero.debug(`Syntero: 堆栈: ${e.stack}`);
		}
	},
	
	shutdown: function() {
		if (!this.initialized) {
			return;
		}
		
		try {
			Zotero.Syntero.Sync.shutdown();
			Zotero.Syntero.UI.shutdown();
			Zotero.Syntero.Preferences.shutdown();
			
			this.initialized = false;
			Zotero.debug('Syntero: 插件关闭完成');
		} catch (e) {
			Zotero.debug(`Syntero: 关闭错误: ${e.message}`);
		}
	}
};
