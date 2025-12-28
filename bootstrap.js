// Syntero插件启动文件
// Zotero 7+ 使用

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { FileUtils } = ChromeUtils.import("resource://gre/modules/FileUtils.jsm");

async function startup({ id, version, rootURI }) {
	Services.obs.notifyObservers({wrappedJSObject: {id, version, rootURI}}, 'syntero-startup');
	
	try {
		const { FileUtils } = ChromeUtils.import("resource://gre/modules/FileUtils.jsm");
		const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
		
		// 处理rootURI路径
		let basePath;
		if (rootURI.startsWith('chrome://')) {
			const uri = Services.io.newURI(rootURI);
			basePath = uri.path;
		} else if (rootURI.startsWith('file://')) {
			const uri = Services.io.newURI(rootURI);
			basePath = uri.path;
		} else {
			basePath = rootURI;
		}
		
		if (basePath.endsWith('/')) {
			basePath = basePath.slice(0, -1);
		}
		
		const handler = Services.io.getProtocolHandler('chrome');
		const chromeHandler = handler.QueryInterface(Components.interfaces.nsIProtocolHandler);
		
		let scriptPath = basePath;
		if (!scriptPath.endsWith('/')) {
			scriptPath += '/';
		}
		
		Services.console.logStringMessage(`Syntero: 从 ${scriptPath} 加载脚本`);
		
		// 按顺序加载模块
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/include.js', {});
			Services.console.logStringMessage('Syntero: include.js 已加载');
		} catch (e) {
			throw new Error(`加载 include.js 失败: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-core.js', {});
			Services.console.logStringMessage('Syntero: syntero-core.js 已加载');
		} catch (e) {
			throw new Error(`加载 syntero-core.js 失败: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-preferences.js', {});
			Services.console.logStringMessage('Syntero: syntero-preferences.js 已加载');
		} catch (e) {
			throw new Error(`加载 syntero-preferences.js 失败: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-storage.js', {});
			Services.console.logStringMessage('Syntero: syntero-storage.js 已加载');
		} catch (e) {
			throw new Error(`加载 syntero-storage.js 失败: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-sync.js', {});
			Services.console.logStringMessage('Syntero: syntero-sync.js 已加载');
		} catch (e) {
			throw new Error(`加载 syntero-sync.js 失败: ${e.message}`);
		}
		
		try {
			Services.scriptloader.loadSubScript(scriptPath + 'content/syntero-ui.js', {});
			Services.console.logStringMessage('Syntero: syntero-ui.js 已加载');
		} catch (e) {
			throw new Error(`加载 syntero-ui.js 失败: ${e.message}`);
		}
		
		if (typeof Zotero === 'undefined' || typeof Zotero.Syntero === 'undefined') {
			throw new Error('Zotero.Syntero 命名空间未找到');
		}
		
		if (typeof Zotero.Syntero.Core === 'undefined' || typeof Zotero.Syntero.Core.init !== 'function') {
			throw new Error('Zotero.Syntero.Core.init 未找到');
		}
		
		Zotero.Syntero.Core.init(rootURI);
		
		Services.console.logStringMessage('Syntero: 插件加载并初始化成功');
	} catch (e) {
		const errorMsg = e.message || String(e);
		const errorStack = e.stack || '无堆栈跟踪';
		Services.console.logStringMessage(`Syntero 启动错误: ${errorMsg}`);
		Services.console.logStringMessage(`Syntero 堆栈: ${errorStack}`);
		Services.console.logStringMessage(`Syntero rootURI: ${rootURI}`);
	}
}

async function shutdown({ id, reason }) {
	try {
		if (Zotero.Syntero && Zotero.Syntero.Core) {
			Zotero.Syntero.Core.shutdown();
		}
	} catch (e) {
		Services.console.logStringMessage(`Syntero 关闭错误: ${e.message}`);
	}
	Services.obs.notifyObservers({wrappedJSObject: {id, reason}}, 'syntero-shutdown');
}

function install({ id, version, reason }) {
	// 安装逻辑
}

function uninstall({ id, reason }) {
	// 卸载逻辑
}
