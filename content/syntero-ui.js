/*
 * Syntero - UI Management
 * Handles user interface elements and preferences pane injection
 * 
 * Copyright (c) 2025 YU Shi Jiong
 * Licensed under AGPL-3.0
 */

if (typeof Zotero.Syntero === 'undefined') {
	Zotero.Syntero = {};
}

Zotero.Syntero.UI = {
	initialized: false,
	windowObserver: null,
	
	/**
	 * Initialize UI components
	 */
	init: function() {
		if (this.initialized) {
			return;
		}
		
		try {
			this.setupPreferencesPane();
			this.setupMenuItems();
			this.setupToolbarButton();
			this.initialized = true;
			Zotero.debug('Syntero.UI: Initialized');
		} catch (e) {
			Zotero.debug(`Syntero.UI: Init error: ${e.message}`);
			Zotero.debug(`Syntero.UI: Stack: ${e.stack}`);
		}
	},
	
	/**
	 * Setup toolbar button in Zotero main window
	 */
	setupToolbarButton: function() {
		try {
			// Wait for Zotero to be fully loaded
			setTimeout(() => {
				this.addToolbarButton();
			}, 3000);
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error setting up toolbar button: ${e.message}`);
		}
	},
	
	/**
	 * Add toolbar button to main window
	 */
	addToolbarButton: function() {
		try {
			const mainWindow = Zotero.getMainWindow();
			if (!mainWindow || !mainWindow.document) {
				Zotero.debug('Syntero.UI: Main window not available for toolbar button');
				return;
			}
			
			// Check if button already exists
			if (mainWindow.document.getElementById('syntero-toolbar-button')) {
				return;
			}
			
			// Find toolbar - try different possible IDs
			let toolbar = mainWindow.document.getElementById('zotero-toolbar') ||
			              mainWindow.document.getElementById('toolbar') ||
			              mainWindow.document.querySelector('toolbar');
			
			if (!toolbar) {
				// Try to find by class or other attributes
				const toolbars = mainWindow.document.getElementsByTagName('toolbar');
				if (toolbars.length > 0) {
					toolbar = toolbars[0];
				}
			}
			
			if (!toolbar) {
				Zotero.debug('Syntero.UI: Could not find toolbar');
				// Fallback: add to status bar or create a separate panel
				this.addStatusBarButton(mainWindow);
				return;
			}
			
			// Create button
			const button = mainWindow.document.createElement('toolbarbutton');
			button.id = 'syntero-toolbar-button';
			button.setAttribute('label', 'Syntero');
			button.setAttribute('tooltiptext', 'Syntero Settings Sync - Click to sync settings');
			button.setAttribute('class', 'toolbarbutton-1');
			
			// Add text label
			button.textContent = 'Syntero';
			button.setAttribute('style', 'padding: 2px 8px; margin: 2px; cursor: pointer;');
			
			// Add click event listener
			button.addEventListener('command', (e) => {
				e.preventDefault();
				e.stopPropagation();
				Zotero.Syntero.UI.openSynteroSettings();
			}, false);
			
			// Also add onclick as fallback
			button.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				Zotero.Syntero.UI.openSynteroSettings();
			}, false);
			
			// Insert button into toolbar
			toolbar.appendChild(button);
			
			Zotero.debug('Syntero.UI: Toolbar button added successfully');
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error adding toolbar button: ${e.message}`);
			Zotero.debug(`Syntero.UI: Stack: ${e.stack}`);
			// Fallback to status bar
			try {
				const mainWindow = Zotero.getMainWindow();
				if (mainWindow) {
					this.addStatusBarButton(mainWindow);
				}
			} catch (e2) {
				Zotero.debug(`Syntero.UI: Error adding status bar button: ${e2.message}`);
			}
		}
	},
	
	/**
	 * Add button to status bar as fallback
	 */
	addStatusBarButton: function(mainWindow) {
		try {
			// Find status bar
			const statusbar = mainWindow.document.getElementById('statusbar') ||
			                  mainWindow.document.getElementById('zotero-statusbar') ||
			                  mainWindow.document.querySelector('statusbar');
			
			if (!statusbar) {
				Zotero.debug('Syntero.UI: Could not find status bar');
				return;
			}
			
			// Check if already exists
			if (mainWindow.document.getElementById('syntero-statusbar-button')) {
				return;
			}
			
			// Create status bar panel
			const panel = mainWindow.document.createElement('statusbarpanel');
			panel.id = 'syntero-statusbar-button';
			panel.setAttribute('class', 'statusbarpanel-iconic');
			
			const label = mainWindow.document.createElement('label');
			label.setAttribute('value', 'Syntero');
			label.setAttribute('style', 'cursor: pointer; padding: 2px 5px;');
			label.addEventListener('click', () => {
				this.openSynteroSettings();
			}, false);
			
			panel.appendChild(label);
			statusbar.appendChild(panel);
			
			Zotero.debug('Syntero.UI: Status bar button added successfully');
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error adding status bar button: ${e.message}`);
		}
	},
	
	/**
	 * Setup menu items as alternative access method
	 */
	setupMenuItems: function() {
		try {
			// Wait for Zotero to be fully loaded
			setTimeout(() => {
				this.addMenuItems();
			}, 2000);
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error setting up menu items: ${e.message}`);
		}
	},
	
	/**
	 * Add menu items to Zotero menu
	 */
	addMenuItems: function() {
		try {
			const mainWindow = Zotero.getMainWindow();
			if (!mainWindow || !mainWindow.document) {
				Zotero.debug('Syntero.UI: Main window not available');
				return;
			}
			
			// Find menu bar
			const menuBar = mainWindow.document.getElementById('main-menubar');
			if (!menuBar) {
				Zotero.debug('Syntero.UI: Menu bar not found');
				return;
			}
			
			// Try to find Zotero menu (macOS) or Tools menu (Windows/Linux)
			let menu = mainWindow.document.getElementById('zotero-menu') || 
			           mainWindow.document.getElementById('menu_Tools');
			
			if (!menu) {
				// Try to find by looking through all menus
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
				Zotero.debug('Syntero.UI: Could not find menu');
				return;
			}
			
			// Get the menupopup
			const menuPopup = menu.querySelector('menupopup') || menu;
			
			// Check if already added
			if (mainWindow.document.getElementById('syntero-menu-settings')) {
				return;
			}
			
			// Create separator
			const separator = mainWindow.document.createElement('menuseparator');
			separator.id = 'syntero-menu-separator';
			menuPopup.appendChild(separator);
			
			// Create "Syntero Settings" menu item
			const menuItem = mainWindow.document.createElement('menuitem');
			menuItem.id = 'syntero-menu-settings';
			menuItem.setAttribute('label', 'Syntero Settings...');
			menuItem.addEventListener('command', () => {
				this.openSynteroSettings();
			}, false);
			menuPopup.appendChild(menuItem);
			
			Zotero.debug('Syntero.UI: Menu items added successfully');
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error adding menu items: ${e.message}`);
			Zotero.debug(`Syntero.UI: Stack: ${e.stack}`);
		}
	},
	
	/**
	 * Show quick sync dialog (replaces openSynteroSettings)
	 * Only opens preferences if user performs an action, not on Cancel
	 */
	openSynteroSettings: function() {
		// Just show the dialog, don't open preferences automatically
		// Preferences will only open if user clicks Upload or Sync
		this.showQuickSyncDialog();
	},
	
	/**
	 * Show quick sync dialog with Upload, Sync, and Cancel buttons
	 */
	showQuickSyncDialog: function() {
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			const promptService = Services.prompt;
			
			Zotero.debug('Syntero.UI: Showing sync dialog');
			
			// Create dialog with three buttons: Upload, Sync, and Cancel
			// BUTTON_POS_0 = Upload, BUTTON_POS_1 = Sync, BUTTON_POS_2 = Cancel
			const flags = promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_IS_STRING +
			              promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_IS_STRING +
			              promptService.BUTTON_POS_2 * promptService.BUTTON_TITLE_IS_STRING;
			
			const button0Title = "上传"; // Upload
			const button1Title = "Sync"; // Sync (download and apply)
			const button2Title = "Cancel"; // Cancel (close without action)
			
			const message = "Syntero 设置同步\n\n" +
			                "• 上传：将当前设置上传到云端\n" +
			                "• Sync：从云端下载并应用设置（覆盖当前设置）\n" +
			                "• Cancel：取消操作，不进行任何更改\n\n" +
			                "点击 Cancel 关闭窗口";
			
			const result = promptService.confirmEx(
				null, // parent window
				"Syntero Settings Sync",
				message,
				flags,
				button0Title,
				button1Title,
				button2Title,
				null, // checkMsg
				{} // checkState
			);
			
			Zotero.debug(`Syntero.UI: Dialog result: ${result}`);
			
			if (result === 0) {
				// Upload (button 0)
				Zotero.debug('Syntero.UI: User chose Upload');
				Zotero.Syntero.UI.updateSyncStatus('Uploading...');
				Zotero.Syntero.Sync.uploadSettings().then(() => {
					Zotero.Syntero.UI.updateSyncStatus('Upload Complete');
					Zotero.Syntero.UI.showNotification('上传成功', '设置已上传到云端', 'info');
				}).catch(e => {
					Zotero.debug(`Syntero.UI: Upload error: ${e.message}`);
					Zotero.Syntero.UI.updateSyncStatus('Upload Failed');
					Zotero.Syntero.UI.showNotification('上传失败', `错误: ${e.message}`, 'error');
				});
			} else if (result === 1) {
				// Sync (button 1) - Download and apply (force apply)
				Zotero.debug('Syntero.UI: User chose Sync (download and apply)');
				Zotero.Syntero.UI.updateSyncStatus('Syncing...');
				// Force apply when user explicitly clicks Sync button
				Zotero.Syntero.Sync.checkForUpdates(true).then(() => {
					Zotero.Syntero.UI.updateSyncStatus('Sync Complete');
					Zotero.Syntero.UI.showNotification('同步成功', '已从云端下载并应用设置', 'info');
				}).catch(e => {
					Zotero.debug(`Syntero.UI: Sync error: ${e.message}`);
					Zotero.Syntero.UI.updateSyncStatus('Sync Failed');
					Zotero.Syntero.UI.showNotification('同步失败', `错误: ${e.message}`, 'error');
				});
			} else if (result === 2) {
				// Cancel (button 2) - Close without action, don't open preferences
				Zotero.debug('Syntero.UI: User chose Cancel - closing dialog without action');
				// Do nothing, just close the dialog
			} else {
				// Closed via window close button or ESC key
				Zotero.debug('Syntero.UI: User closed dialog');
			}
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error showing sync dialog: ${e.message}`);
			Zotero.debug(`Syntero.UI: Stack: ${e.stack}`);
			
			// Fallback: try simpler alert
			try {
				const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
				Services.prompt.alert(
					null,
					"Syntero Settings Sync",
					"Syntero 设置同步\n\n使用工具栏按钮或菜单访问同步功能。"
				);
			} catch (e2) {
				Zotero.debug(`Syntero.UI: Error showing alert: ${e2.message}`);
			}
		}
	},
	
	/**
	 * Setup preferences pane injection
	 */
	setupPreferencesPane: function() {
		try {
			const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
			
			// Listen for window opening
			this.windowObserver = {
				observe: (subject, topic, data) => {
					if (topic === 'domwindowopened') {
						try {
							// Try to get window from subject
							let window = null;
							if (subject && typeof subject.QueryInterface === 'function') {
								window = subject.QueryInterface(Components.interfaces.nsIDOMWindow);
							} else if (subject && subject.document) {
								// Subject might already be a window
								window = subject;
							} else if (subject && subject.wrappedJSObject) {
								window = subject.wrappedJSObject;
							}
							
							if (window && window.location && window.location.href && window.location.href.includes('preferences')) {
								setTimeout(() => {
									this.injectIntoSyncPane(window);
								}, 500);
							}
						} catch (e) {
							Zotero.debug(`Syntero.UI: Error in window observer: ${e.message}`);
						}
					}
				}
			};
			
			Services.obs.addObserver(this.windowObserver, 'domwindowopened');
			
			// Also try to inject if preferences window is already open
			setTimeout(() => {
				this.tryInjectIntoSyncPane();
			}, 2000);
			
			Zotero.debug('Syntero.UI: Registered observer for preferences window');
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error setting up preferences pane: ${e.message}`);
		}
	},
	
	/**
	 * Try to inject into sync pane if window is already open
	 */
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
			Zotero.debug(`Syntero.UI: Error trying to inject: ${e.message}`);
		}
	},
	
	/**
	 * Inject Syntero UI into sync preferences pane
	 */
	injectIntoSyncPane: function(prefsWindow) {
		try {
			if (!prefsWindow || !prefsWindow.document) {
				Zotero.debug('Syntero.UI: Invalid preferences window');
				return;
			}
			
			// Check if already injected
			if (prefsWindow.document.getElementById('syntero-sync-section')) {
				Zotero.debug('Syntero.UI: Already injected');
				return;
			}
			
			Zotero.debug('Syntero.UI: Attempting to inject into sync pane...');
			
			// Wait a bit for the preferences window to fully load
			setTimeout(() => {
				this.doInjectIntoSyncPane(prefsWindow);
			}, 1000);
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error in injectIntoSyncPane: ${e.message}`);
			Zotero.debug(`Syntero.UI: Stack: ${e.stack}`);
		}
	},
	
	/**
	 * Actually perform the injection
	 */
	doInjectIntoSyncPane: function(prefsWindow) {
		try {
			// Find sync pane - try multiple methods
			let syncPane = null;
			
			// Method 1: Try common IDs
			const possibleIDs = ['sync-prefs', 'pane-sync', 'syncPane', 'prefpane-sync'];
			for (const id of possibleIDs) {
				syncPane = prefsWindow.document.getElementById(id);
				if (syncPane) {
					Zotero.debug(`Syntero.UI: Found sync pane by ID: ${id}`);
					break;
				}
			}
			
			// Method 2: Try to find by attribute
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
						Zotero.debug(`Syntero.UI: Found sync pane by content: ${id || label}`);
						break;
					}
				}
			}
			
			// Method 3: Try to find by looking for sync-related elements
			if (!syncPane) {
				// Look for elements that might be in the sync pane
				const syncElements = prefsWindow.document.querySelectorAll('[id*="sync"], [label*="sync"], [label*="同步"]');
				if (syncElements.length > 0) {
					// Find the parent prefpane
					let element = syncElements[0];
					while (element && element.tagName !== 'prefpane') {
						element = element.parentElement;
					}
					if (element) {
						syncPane = element;
						Zotero.debug('Syntero.UI: Found sync pane by child elements');
					}
				}
			}
			
			if (!syncPane) {
				Zotero.debug('Syntero.UI: Could not find sync preferences pane');
				Zotero.debug('Syntero.UI: Available panes:');
				const allPanes = prefsWindow.document.querySelectorAll('prefpane');
				for (const pane of allPanes) {
					Zotero.debug(`  - ID: ${pane.id}, Label: ${pane.getAttribute('label')}`);
				}
				return;
			}
			
			// Create and inject UI
			const synteroSection = this.createSynteroSection(prefsWindow);
			syncPane.appendChild(synteroSection);
			
			Zotero.debug('Syntero.UI: Successfully injected into sync preferences pane');
			
		} catch (e) {
			Zotero.debug(`Syntero.UI: Error in doInjectIntoSyncPane: ${e.message}`);
			Zotero.debug(`Syntero.UI: Stack: ${e.stack}`);
		}
	},
	
	/**
	 * Create Syntero section UI
	 */
	createSynteroSection: function(prefsWindow) {
		const doc = prefsWindow.document;
		
		const section = doc.createElement('groupbox');
		section.id = 'syntero-sync-section';
		section.setAttribute('style', 'margin-top: 20px;');
		
		// Caption
		const caption = doc.createElement('caption');
		caption.setAttribute('label', 'Syntero - Settings Sync');
		section.appendChild(caption);
		
		// Description
		const desc = doc.createElement('description');
		desc.textContent = 'Syntero helps you synchronize your Zotero preferences across all your devices. Upload is manual only - click "Upload Settings" to upload your current settings.';
		desc.setAttribute('style', 'margin: 10px;');
		section.appendChild(desc);
		
		// Status row
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
		
		// Buttons
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
		
		// Last sync
		const lastSyncRow = doc.createElement('description');
		lastSyncRow.setAttribute('style', 'margin: 10px;');
		lastSyncRow.innerHTML = '<strong>Last Synced:</strong> <label id="syntero-last-sync" value="Never"/>';
		section.appendChild(lastSyncRow);
		
		// Auto download checkbox (upload is always manual)
		const autoDownloadRow = doc.createElement('checkbox');
		autoDownloadRow.id = 'syntero-auto-download-checkbox';
		autoDownloadRow.setAttribute('label', 'Enable automatic download (check for updates every 5 minutes)');
		autoDownloadRow.setAttribute('checked', 'true');
		autoDownloadRow.setAttribute('style', 'margin: 10px;');
		autoDownloadRow.addEventListener('command', (e) => {
			Zotero.Prefs.set('extensions.syntero.autoDownload', e.target.checked);
		});
		section.appendChild(autoDownloadRow);
		
		// Info about manual upload
		const manualUploadInfo = doc.createElement('description');
		manualUploadInfo.setAttribute('style', 'margin: 10px; font-size: 90%; color: gray;');
		manualUploadInfo.textContent = 'Note: Upload is always manual. Click "Upload Settings" or "Sync Now" to upload your settings.';
		section.appendChild(manualUploadInfo);
		
		// Device ID
		const deviceIdRow = doc.createElement('description');
		deviceIdRow.setAttribute('style', 'margin: 10px; font-size: 90%;');
		deviceIdRow.innerHTML = '<strong>Device ID:</strong> <label id="syntero-device-id"/>';
		section.appendChild(deviceIdRow);
		
		// Update device ID
		setTimeout(() => {
			const deviceIdLabel = doc.getElementById('syntero-device-id');
			if (deviceIdLabel) {
				deviceIdLabel.setAttribute('value', Zotero.Syntero.Storage.getDeviceId());
			}
		}, 100);
		
		return section;
	},
	
	/**
	 * Update sync status in UI
	 */
	updateSyncStatus: function(message) {
		Zotero.debug(`Syntero Status: ${message}`);
		
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
			// UI not available
		}
	},
	
	/**
	 * Show notification
	 */
	showNotification: function(title, message, type = 'info') {
		Zotero.debug(`Syntero Notification [${type}]: ${title} - ${message}`);
		// Full implementation would use Zotero's notification system
	},
	
	/**
	 * Shutdown UI components
	 */
	shutdown: function() {
		if (this.windowObserver) {
			try {
				const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
				Services.obs.removeObserver(this.windowObserver, 'domwindowopened');
			} catch (e) {
				// Ignore
			}
			this.windowObserver = null;
		}
		
		// Remove menu items
		try {
			const mainWindow = Zotero.getMainWindow();
			if (mainWindow && mainWindow.document) {
				const menuItem = mainWindow.document.getElementById('syntero-menu-settings');
				const separator = mainWindow.document.getElementById('syntero-menu-separator');
				if (menuItem) menuItem.remove();
				if (separator) separator.remove();
				
				// Remove toolbar button
				const toolbarButton = mainWindow.document.getElementById('syntero-toolbar-button');
				if (toolbarButton) toolbarButton.remove();
				
				// Remove status bar button
				const statusbarButton = mainWindow.document.getElementById('syntero-statusbar-button');
				if (statusbarButton) statusbarButton.remove();
			}
		} catch (e) {
			// Ignore
		}
		
		this.initialized = false;
	}
};

