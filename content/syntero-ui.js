// UI管理
if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.UI = {
	initialized: false,
	windowObserver: null,
	mainWindowObserver: null,
	windowCheckInterval: null,
	
	init: function() {
		if (this.initialized) {
			return;
		}
		
		try {
			this.setupWindowObserver();
			this.setupPreferencesPane();
			this.setupMenuItems();
			this.setupToolbarButton();
			this.initialized = true;
			Zotero.debug('Syntero.UI: 已初始化');
		} catch (e) {
			Zotero.debug(`Syntero.UI: 初始化错误: ${e.message}`);
			Zotero.debug(`Syntero.UI: 堆栈: ${e.stack}`);
		}
	},
	
	setupWindowObserver: function() {
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			
			// 监听所有窗口打开事件
			const self = this;
			this.mainWindowObserver = {
				observe: function(subject, topic, data) {
					if (topic === 'domwindowopened') {
						try {
							let window = null;
							if (subject && typeof subject.QueryInterface === 'function') {
								window = subject.QueryInterface(Components.interfaces.nsIDOMWindow);
							} else if (subject && subject.document) {
								window = subject;
							} else if (subject && subject.wrappedJSObject) {
								window = subject.wrappedJSObject;
							}
							
							if (!window || !window.document) {
								return;
							}
							
							const href = window.location.href || '';
							
							// 延迟检查，确保窗口完全加载
							setTimeout(function() {
								try {
									if (window.document) {
										// 检查是否是Zotero主窗口 - 简化检测逻辑
										const hasZoteroElements = window.document.getElementById('zotero-pane') ||
										                        window.document.getElementById('zotero-items-tree') ||
										                        window.document.getElementById('zotero-toolbar');
										
										if (hasZoteroElements) {
											Zotero.debug('Syntero.UI: 检测到主窗口打开，重新添加按钮');
											self.addToolbarButton();
											self.addMenuItems();
										}
										
										// 检查是否是偏好窗口
										if (href.includes('preferences')) {
											self.injectIntoSyncPane(window);
										}
									}
								} catch (e) {
									Zotero.debug('Syntero.UI: 处理窗口打开错误: ' + e.message);
								}
							}, 2000);
						} catch (e) {
							Zotero.debug('Syntero.UI: 窗口观察者错误: ' + e.message);
						}
					}
				}
			};
			
			Services.obs.addObserver(this.mainWindowObserver, 'domwindowopened');
			
			// 立即尝试添加按钮（如果主窗口已存在）
			setTimeout(() => {
				this.addToolbarButton();
				this.addMenuItems();
			}, 2000);
			
			// 定期检查主窗口，确保按钮存在
			this.windowCheckInterval = setInterval(() => {
				try {
					const mainWindow = Zotero.getMainWindow();
					if (mainWindow && mainWindow.document) {
						const button = mainWindow.document.getElementById('syntero-toolbar-button');
						const menuItem = mainWindow.document.getElementById('syntero-menu-settings');
						
						if (!button) {
							Zotero.debug('Syntero.UI: 定期检查发现工具栏按钮缺失，重新添加');
							this.addToolbarButton();
						}
						if (!menuItem) {
							Zotero.debug('Syntero.UI: 定期检查发现菜单项缺失，重新添加');
							this.addMenuItems();
						}
					}
				} catch (e) {
					// 忽略错误
				}
			}, 3000); // 每3秒检查一次
			
			Zotero.debug('Syntero.UI: 已注册主窗口观察者和定期检查');
		} catch (e) {
			Zotero.debug(`Syntero.UI: 设置窗口观察者错误: ${e.message}`);
		}
	},
	
	setupToolbarButton: function() {
		// 按钮添加现在由setupWindowObserver和定期检查处理
		// 这里保留一个初始尝试
		try {
			setTimeout(() => {
				this.addToolbarButton();
			}, 1000);
		} catch (e) {
			Zotero.debug(`Syntero.UI: 设置工具栏按钮错误: ${e.message}`);
		}
	},
	
	addToolbarButton: function() {
		try {
			const mainWindow = Zotero.getMainWindow();
			if (!mainWindow || !mainWindow.document) {
				Zotero.debug('Syntero.UI: 主窗口不可用');
				return;
			}
			
			if (mainWindow.document.getElementById('syntero-toolbar-button')) {
				return;
			}
			
			let toolbar = mainWindow.document.getElementById('zotero-toolbar') ||
			              mainWindow.document.getElementById('toolbar') ||
			              mainWindow.document.querySelector('toolbar');
			
			if (!toolbar) {
				const toolbars = mainWindow.document.getElementsByTagName('toolbar');
				if (toolbars.length > 0) {
					toolbar = toolbars[0];
				}
			}
			
			if (!toolbar) {
				Zotero.debug('Syntero.UI: 找不到工具栏');
				this.addStatusBarButton(mainWindow);
				return;
			}
			
			const button = mainWindow.document.createElement('toolbarbutton');
			button.id = 'syntero-toolbar-button';
			button.setAttribute('label', 'Syntero');
			button.setAttribute('tooltiptext', 'Syntero Settings Sync - Click to sync settings');
			button.setAttribute('class', 'syntero-custom-button');
			
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			let rootURI = Zotero.Syntero.Core.rootURI;
			let iconPath = null;
			
			if (rootURI) {
				if (rootURI.startsWith('chrome://')) {
					iconPath = rootURI + 'icons/syntero-icon-16.png';
				} else if (rootURI.startsWith('file://')) {
					const uri = Services.io.newURI(rootURI);
					iconPath = 'file://' + uri.path + (uri.path.endsWith('/') ? '' : '/') + 'icons/syntero-icon-16.png';
				} else {
					iconPath = rootURI + (rootURI.endsWith('/') ? '' : '/') + 'icons/syntero-icon-16.png';
				}
				
				try {
					button.setAttribute('image', iconPath);
					Zotero.debug(`Syntero.UI: 图标设置为 ${iconPath}`);
				} catch (e) {
					Zotero.debug(`Syntero.UI: 无法设置图标: ${e.message}`);
				}
			}
			
			button.textContent = 'Syntero';
			
			button.style.padding = '4px 12px';
			button.style.margin = '2px 4px';
			button.style.cursor = 'pointer';
			button.style.backgroundColor = '#E3F2FD';
			button.style.border = '1px solid #90CAF9';
			button.style.borderRadius = '4px';
			button.style.color = '#1976D2';
			button.style.fontWeight = '500';
			button.style.minWidth = '60px';
			button.style.height = '24px';
			button.style.textAlign = 'center';
			button.style.display = '-moz-box';
			button.style.MozBoxAlign = 'center';
			button.style.MozBoxPack = 'center';
			button.style.verticalAlign = 'middle';
			button.style.lineHeight = '24px';
			
			button.setAttribute('style', button.style.cssText);
			
			button.addEventListener('mouseenter', function() {
				this.style.backgroundColor = '#BBDEFB';
				this.style.borderColor = '#64B5F6';
				this.style.color = '#1565C0';
				this.setAttribute('style', this.style.cssText);
			});
			
			button.addEventListener('mouseleave', function() {
				this.style.backgroundColor = '#E3F2FD';
				this.style.borderColor = '#90CAF9';
				this.style.color = '#1976D2';
				this.setAttribute('style', this.style.cssText);
			});
			
			button.addEventListener('command', function(e) {
				e.preventDefault();
				e.stopPropagation();
				Zotero.Syntero.UI.openSynteroSettings();
			}, false);
			
			button.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				Zotero.Syntero.UI.openSynteroSettings();
			}, false);
			
			toolbar.appendChild(button);
			
			Zotero.debug('Syntero.UI: 工具栏按钮添加成功');
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: 添加工具栏按钮错误: ${e.message}`);
			Zotero.debug(`Syntero.UI: 堆栈: ${e.stack}`);
			try {
				const mainWindow = Zotero.getMainWindow();
				if (mainWindow) {
					this.addStatusBarButton(mainWindow);
				}
			} catch (e2) {
				Zotero.debug(`Syntero.UI: 添加状态栏按钮错误: ${e2.message}`);
			}
		}
	},
	
	addStatusBarButton: function(mainWindow) {
		try {
			const statusbar = mainWindow.document.getElementById('statusbar') ||
			                  mainWindow.document.getElementById('zotero-statusbar') ||
			                  mainWindow.document.querySelector('statusbar');
			
			if (!statusbar) {
				Zotero.debug('Syntero.UI: 找不到状态栏');
				return;
			}
			
			if (mainWindow.document.getElementById('syntero-statusbar-button')) {
				return;
			}
			
			const panel = mainWindow.document.createElement('statusbarpanel');
			panel.id = 'syntero-statusbar-button';
			panel.setAttribute('class', 'statusbarpanel-iconic');
			
			const label = mainWindow.document.createElement('label');
			label.setAttribute('value', 'Syntero');
			label.setAttribute('style', 
				'cursor: pointer; ' +
				'padding: 4px 10px; ' +
				'background-color: #E3F2FD; ' +
				'border: 1px solid #90CAF9; ' +
				'border-radius: 4px; ' +
				'color: #1976D2; ' +
				'font-weight: 500; ' +
				'margin: 2px;'
			);
			const self2 = this;
			label.addEventListener('click', function() {
				self2.openSynteroSettings();
			}, false);
			
			label.addEventListener('mouseenter', function() {
				this.setAttribute('style', 
					'cursor: pointer; ' +
					'padding: 4px 10px; ' +
					'background-color: #BBDEFB; ' +
					'border: 1px solid #64B5F6; ' +
					'border-radius: 4px; ' +
					'color: #1565C0; ' +
					'font-weight: 500; ' +
					'margin: 2px;'
				);
			});
			
			label.addEventListener('mouseleave', function() {
				this.setAttribute('style', 
					'cursor: pointer; ' +
					'padding: 4px 10px; ' +
					'background-color: #E3F2FD; ' +
					'border: 1px solid #90CAF9; ' +
					'border-radius: 4px; ' +
					'color: #1976D2; ' +
					'font-weight: 500; ' +
					'margin: 2px;'
				);
			});
			
			panel.appendChild(label);
			statusbar.appendChild(panel);
			
			Zotero.debug('Syntero.UI: 状态栏按钮添加成功');
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: 添加状态栏按钮错误: ${e.message}`);
		}
	},
	
	setupMenuItems: function() {
		try {
			setTimeout(() => {
				this.addMenuItems();
			}, 2000);
		} catch (e) {
			Zotero.debug(`Syntero.UI: 设置菜单项错误: ${e.message}`);
		}
	},
	
	addMenuItems: function() {
		try {
			const mainWindow = Zotero.getMainWindow();
			if (!mainWindow || !mainWindow.document) {
				Zotero.debug('Syntero.UI: 主窗口不可用');
				return;
			}
			
			const menuBar = mainWindow.document.getElementById('main-menubar');
			if (!menuBar) {
				Zotero.debug('Syntero.UI: 找不到菜单栏');
				return;
			}
			
			let menu = mainWindow.document.getElementById('zotero-menu') || 
			           mainWindow.document.getElementById('menu_Tools');
			
			if (!menu) {
				const menus = menuBar.getElementsByTagName('menu');
				for (const m of menus) {
					const label = m.getAttribute('label') || '';
					if (label.includes('Zotero') || label.includes('工具') || label.includes('Tools')) {
						menu = m;
						break;
					}
				}
			}
			
			if (!menu) {
				Zotero.debug('Syntero.UI: 找不到菜单');
				return;
			}
			
			const menuPopup = menu.querySelector('menupopup') || menu;
			
			if (mainWindow.document.getElementById('syntero-menu-settings')) {
				return;
			}
			
			const separator = mainWindow.document.createElement('menuseparator');
			separator.id = 'syntero-menu-separator';
			menuPopup.appendChild(separator);
			
			const menuItem = mainWindow.document.createElement('menuitem');
			menuItem.id = 'syntero-menu-settings';
			menuItem.setAttribute('label', 'Syntero Settings...');
			const self3 = this;
			menuItem.addEventListener('command', function() {
				self3.openSynteroSettings();
			}, false);
			menuPopup.appendChild(menuItem);
			
			Zotero.debug('Syntero.UI: 菜单项添加成功');
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: 添加菜单项错误: ${e.message}`);
			Zotero.debug(`Syntero.UI: 堆栈: ${e.stack}`);
		}
	},
	
	openSynteroSettings: function() {
		this.showQuickSyncDialog();
	},
	
	showQuickSyncDialog: function() {
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			const promptService = Services.prompt;
			
			Zotero.debug('Syntero.UI: 显示同步对话框');
			
			const flags = promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_IS_STRING +
			              promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_IS_STRING +
			              promptService.BUTTON_POS_2 * promptService.BUTTON_TITLE_IS_STRING;
			
			const button0Title = "Sync";
			const button1Title = "上传";
			const button2Title = "Cancel";
			
			const message = "Syntero 设置同步\n\n" +
			                "• Sync：从云端下载并应用设置（覆盖当前设置）\n" +
			                "• 上传：将当前设置上传到云端\n" +
			                "• Cancel：取消操作，关闭窗口";
			
			const result = promptService.confirmEx(
				null,
				"Syntero Settings Sync",
				message,
				flags,
				button0Title,
				button1Title,
				button2Title,
				null,
				{}
			);
			
			Zotero.debug(`Syntero.UI: 对话框结果: ${result}`);
			
			if (result === 0) {
				Zotero.debug('Syntero.UI: 用户选择 Sync');
				this.updateSyncStatus('同步中...');
				Zotero.Syntero.Sync.checkForUpdates(true).then((syncResult) => {
					this.updateSyncStatus('同步完成');
					if (syncResult && syncResult.success) {
						this.showSyncResult(syncResult);
					} else {
						this.showNotification('同步成功', '已从云端下载并应用设置', 'info');
					}
				}).catch(e => {
					Zotero.debug(`Syntero.UI: 同步错误: ${e.message}`);
					this.updateSyncStatus('同步失败');
					
					if (e.message && (e.message.includes('No settings file') || e.message.includes('not found'))) {
						const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
						Services.prompt.alert(
							null,
							'Syntero - Sync',
							'No valid configuration file found in the library.\n\nPlease upload settings first using the "Upload" button.'
						);
					} else {
						this.showNotification('同步失败', `错误: ${e.message}`, 'error');
					}
				});
			} else if (result === 1) {
				Zotero.debug('Syntero.UI: 用户选择上传');
				this.updateSyncStatus('上传中...');
				Zotero.Syntero.Sync.uploadSettings().then((uploadResult) => {
					this.updateSyncStatus('上传完成');
					this.showUploadResult(uploadResult);
				}).catch(e => {
					Zotero.debug(`Syntero.UI: 上传错误: ${e.message}`);
					this.updateSyncStatus('上传失败');
					this.showNotification('上传失败', `错误: ${e.message}`, 'error');
				});
			} else if (result === 2) {
				Zotero.debug('Syntero.UI: 用户选择取消');
				return;
			}
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: 显示同步对话框错误: ${e.message}`);
			Zotero.debug(`Syntero.UI: 堆栈: ${e.stack}`);
		}
	},
	
	showUploadResult: function(uploadResult) {
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			const promptService = Services.prompt;
			
			if (!uploadResult || !uploadResult.settings) {
				this.showNotification('上传成功', '设置已上传到云端', 'info');
				return;
			}
			
			const settings = uploadResult.settings;
			let message = `上传成功\n\n已上传 ${Object.keys(settings.preferences || {}).length} 个设置\n\n上传的设置内容：\n\n`;
			
			const prefs = settings.preferences || {};
			const prefKeys = Object.keys(prefs);
			const keysToShow = prefKeys.slice(0, 30);
			
			keysToShow.forEach((key, index) => {
				message += `${index + 1}. ${key}\n`;
				message += `   值: ${this.formatValue(prefs[key])}\n\n`;
			});
			
			if (prefKeys.length > 30) {
				message += `... 还有 ${prefKeys.length - 30} 个设置未显示\n`;
			}
			
			promptService.alert(
				null,
				'Syntero - 上传完成',
				message
			);
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: 显示上传结果错误: ${e.message}`);
			this.showNotification('上传成功', '设置已上传到云端', 'info');
		}
	},
	
	showSyncResult: function(syncResult) {
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			const promptService = Services.prompt;
			
			if (!syncResult || !syncResult.success) {
				this.showNotification('同步成功', '已从云端下载并应用设置', 'info');
				return;
			}
			
			let message = `同步完成\n\n已成功应用 ${syncResult.appliedCount} 个设置\n\n`;
			
			if (syncResult.changes && syncResult.changes.length > 0) {
				message += `更改的设置 (${syncResult.changes.length} 项):\n\n`;
				
				const changesToShow = syncResult.changes.slice(0, 20);
				changesToShow.forEach((change, index) => {
					message += `${index + 1}. ${change.key}\n`;
					message += `   旧值: ${this.formatValue(change.oldValue)}\n`;
					message += `   新值: ${this.formatValue(change.newValue)}\n\n`;
				});
				
				if (syncResult.changes.length > 20) {
					message += `... 还有 ${syncResult.changes.length - 20} 个更改未显示\n`;
				}
			} else {
				message += '没有检测到设置更改（所有设置值相同）\n';
			}
			
			promptService.alert(
				null,
				'Syntero - 同步完成',
				message
			);
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: 显示同步结果错误: ${e.message}`);
			this.showNotification('同步成功', '已从云端下载并应用设置', 'info');
		}
	},
	
	formatValue: function(value) {
		if (value === null || value === undefined) {
			return '(未设置)';
		}
		if (typeof value === 'object') {
			return JSON.stringify(value);
		}
		if (typeof value === 'boolean') {
			return value ? '是' : '否';
		}
		return String(value);
	},
	
	setupPreferencesPane: function() {
		try {
			setTimeout(() => {
				this.tryInjectIntoSyncPane();
			}, 2000);
			
			Zotero.debug('Syntero.UI: 偏好面板设置完成');
		} catch (e) {
			Zotero.debug(`Syntero.UI: 设置偏好面板错误: ${e.message}`);
		}
	},
	
	tryInjectIntoSyncPane: function() {
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			const windows = Services.wm.getEnumerator(null);
			
			while (windows.hasMoreElements()) {
				const window = windows.getNext();
				if (window.location && window.location.href.includes('preferences')) {
					this.injectIntoSyncPane(window);
					break;
				}
			}
		} catch (e) {
			Zotero.debug(`Syntero.UI: 尝试注入错误: ${e.message}`);
		}
	},
	
	injectIntoSyncPane: function(prefsWindow) {
		try {
			if (!prefsWindow || !prefsWindow.document) {
				Zotero.debug('Syntero.UI: 无效的偏好窗口');
				return;
			}
			
			if (prefsWindow.document.getElementById('syntero-sync-section')) {
				Zotero.debug('Syntero.UI: 已注入');
				return;
			}
			
			Zotero.debug('Syntero.UI: 尝试注入到同步面板...');
			
			setTimeout(() => {
				this.doInjectIntoSyncPane(prefsWindow);
			}, 1000);
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: injectIntoSyncPane 错误: ${e.message}`);
			Zotero.debug(`Syntero.UI: 堆栈: ${e.stack}`);
		}
	},
	
	doInjectIntoSyncPane: function(prefsWindow) {
		try {
			let syncPane = null;
			
			const possibleIDs = ['sync-prefs', 'pane-sync', 'syncPane', 'prefpane-sync'];
			for (const id of possibleIDs) {
				syncPane = prefsWindow.document.getElementById(id);
				if (syncPane) {
					Zotero.debug(`Syntero.UI: 通过ID找到同步面板: ${id}`);
					break;
				}
			}
			
			if (!syncPane) {
				const allPanes = prefsWindow.document.querySelectorAll('prefpane, prefpane');
				for (const pane of allPanes) {
					const id = pane.id || '';
					const label = pane.getAttribute('label') || '';
					const text = pane.textContent || '';
					
					if (id.toLowerCase().includes('sync') || 
					    label.toLowerCase().includes('sync') ||
					    label.includes('同步') ||
					    text.toLowerCase().includes('sync')) {
						syncPane = pane;
						Zotero.debug(`Syntero.UI: 通过内容找到同步面板: ${id || label}`);
						break;
					}
				}
			}
			
			if (!syncPane) {
				const syncElements = prefsWindow.document.querySelectorAll('[id*="sync"], [label*="sync"], [label*="同步"]');
				if (syncElements.length > 0) {
					let element = syncElements[0];
					while (element && element.tagName !== 'prefpane') {
						element = element.parentElement;
					}
					if (element) {
						syncPane = element;
						Zotero.debug('Syntero.UI: 通过子元素找到同步面板');
					}
				}
			}
			
			if (!syncPane) {
				Zotero.debug('Syntero.UI: 找不到同步偏好面板');
				const allPanes = prefsWindow.document.querySelectorAll('prefpane');
				for (const pane of allPanes) {
					Zotero.debug(`  - ID: ${pane.id}, Label: ${pane.getAttribute('label')}`);
				}
				return;
			}
			
			const synteroSection = this.createSynteroSection(prefsWindow);
			syncPane.appendChild(synteroSection);
			
			Zotero.debug('Syntero.UI: 成功注入到同步偏好面板');
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: doInjectIntoSyncPane 错误: ${e.message}`);
			Zotero.debug(`Syntero.UI: 堆栈: ${e.stack}`);
		}
	},
	
	createSynteroSection: function(prefsWindow) {
		const doc = prefsWindow.document;
		
		const section = doc.createElement('groupbox');
		section.id = 'syntero-sync-section';
		section.setAttribute('style', 'margin-top: 20px;');
		
		const caption = doc.createElement('caption');
		caption.setAttribute('label', 'Syntero - Settings Sync');
		section.appendChild(caption);
		
		const desc = doc.createElement('description');
		desc.textContent = 'Syntero helps you synchronize your Zotero preferences across all your devices. Upload is manual only - click "Upload Settings" to upload your current settings.';
		desc.setAttribute('style', 'margin: 10px;');
		section.appendChild(desc);
		
		const statusRow = doc.createElement('hbox');
		statusRow.setAttribute('style', 'margin: 10px;');
		const statusLabel = doc.createElement('label');
		statusLabel.setAttribute('value', 'Sync Status:');
		statusLabel.setAttribute('style', 'margin-right: 10px;');
		const statusValue = doc.createElement('label');
		statusValue.id = 'syntero-status';
		statusValue.setAttribute('value', 'Ready');
		statusValue.setAttribute('style', 'font-weight: bold; color: green;');
		statusRow.appendChild(statusLabel);
		statusRow.appendChild(statusValue);
		section.appendChild(statusRow);
		
		const buttonRow = doc.createElement('hbox');
		buttonRow.setAttribute('style', 'margin: 10px;');
		
		const syncNowBtn = doc.createElement('button');
		syncNowBtn.setAttribute('label', 'Sync Now');
		syncNowBtn.setAttribute('oncommand', 'Zotero.Syntero.Sync.syncNow()');
		buttonRow.appendChild(syncNowBtn);
		
		const uploadBtn = doc.createElement('button');
		uploadBtn.setAttribute('label', 'Upload Settings');
		uploadBtn.setAttribute('oncommand', 'Zotero.Syntero.Sync.uploadSettings()');
		buttonRow.appendChild(uploadBtn);
		
		const downloadBtn = doc.createElement('button');
		downloadBtn.setAttribute('label', 'Download Settings');
		downloadBtn.setAttribute('oncommand', 'Zotero.Syntero.Sync.checkForUpdates()');
		buttonRow.appendChild(downloadBtn);
		
		section.appendChild(buttonRow);
		
		const lastSyncRow = doc.createElement('description');
		lastSyncRow.setAttribute('style', 'margin: 10px;');
		lastSyncRow.innerHTML = '<strong>Last Synced:</strong> <label id="syntero-last-sync" value="Never"/>';
		section.appendChild(lastSyncRow);
		
		const manualInfo = doc.createElement('description');
		manualInfo.setAttribute('style', 'margin: 10px; font-size: 90%; color: gray;');
		manualInfo.textContent = 'Note: All sync operations are manual. Click "Upload Settings" to upload, or "Sync Now" to download and apply settings.';
		section.appendChild(manualInfo);
		
		const deviceIdRow = doc.createElement('description');
		deviceIdRow.setAttribute('style', 'margin: 10px; font-size: 90%;');
		deviceIdRow.innerHTML = '<strong>Device ID:</strong> <label id="syntero-device-id"/>';
		section.appendChild(deviceIdRow);
		
		setTimeout(() => {
			const deviceIdLabel = doc.getElementById('syntero-device-id');
			if (deviceIdLabel) {
				deviceIdLabel.setAttribute('value', Zotero.Syntero.Storage.getDeviceId());
			}
		}, 100);
		
		return section;
	},
	
	updateSyncStatus: function(message) {
		Zotero.debug(`Syntero 状态: ${message}`);
		
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			const windows = Services.wm.getEnumerator(null);
			
			while (windows.hasMoreElements()) {
				const window = windows.getNext();
				if (window.location && window.location.href.includes('preferences')) {
					const statusLabel = window.document.getElementById('syntero-status');
					if (statusLabel) {
						statusLabel.setAttribute('value', message);
					}
					
					const lastSyncLabel = window.document.getElementById('syntero-last-sync');
					if (lastSyncLabel) {
						lastSyncLabel.setAttribute('value', new Date().toLocaleString());
					}
				}
			}
		} catch (e) {
			// UI不可用
		}
	},
	
	showNotification: function(title, message, type = 'info') {
		Zotero.debug(`Syntero 通知 [${type}]: ${title} - ${message}`);
	},
	
	shutdown: function() {
		if (this.windowCheckInterval) {
			clearInterval(this.windowCheckInterval);
			this.windowCheckInterval = null;
		}
		
		if (this.mainWindowObserver) {
			try {
				const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
				Services.obs.removeObserver(this.mainWindowObserver, 'domwindowopened');
			} catch (e) {
				// 忽略
			}
			this.mainWindowObserver = null;
		}
		
		if (this.windowObserver) {
			try {
				const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
				Services.obs.removeObserver(this.windowObserver, 'domwindowopened');
			} catch (e) {
				// 忽略
			}
			this.windowObserver = null;
		}
		
		try {
			const mainWindow = Zotero.getMainWindow();
			if (mainWindow && mainWindow.document) {
				const menuItem = mainWindow.document.getElementById('syntero-menu-settings');
				const separator = mainWindow.document.getElementById('syntero-menu-separator');
				if (menuItem) menuItem.remove();
				if (separator) separator.remove();
				
				const toolbarButton = mainWindow.document.getElementById('syntero-toolbar-button');
				if (toolbarButton) toolbarButton.remove();
				
				const statusbarButton = mainWindow.document.getElementById('syntero-statusbar-button');
				if (statusbarButton) statusbarButton.remove();
			}
		} catch (e) {
			// 忽略
		}
		
		this.initialized = false;
	}
};
