# Syntero - Zotero Settings Sync Plugin

A Zotero plugin that synchronizes your Zotero settings and preferences across multiple devices using Zotero's built-in cloud synchronization.

## Features

- **Manual Upload**: Upload your current Zotero settings to the cloud with detailed settings preview
- **Manual Sync**: Download and apply settings from the cloud (overwrites current settings) with change comparison
- **Cloud Storage**: Uses Zotero's existing cloud sync infrastructure
- **Device Management**: Tracks settings by device ID
- **Easy Access**: Toolbar button with custom icon and menu item for quick access
- **Beautiful UI**: Custom light blue styled button with hover effects

## Installation

1. Download the latest `syntero-1.1.0.xpi` file from the [Releases](https://github.com/EEExphon/Syntero-Plugin/releases) page
2. Open Zotero
3. Go to **Tools → Plugins**
4. Drag the `.xpi` file onto the Plugins window
5. Restart Zotero if prompted

## Usage

### Quick Sync Dialog

Click the **Syntero** button in the Zotero toolbar (or go to **Zotero → Tools → Syntero Settings...**) to open the sync dialog:

- **Sync** (Left): Downloads and applies settings from the cloud (overwrites current settings)
  - After sync, shows a detailed list of all changed settings with old and new values
- **上传 (Upload)** (Middle): Uploads your current settings to the cloud
  - After upload, shows a list of all uploaded settings
- **Cancel** (Right): Closes the dialog without any action

### Settings Preview

- **After Upload**: Displays all settings that were uploaded to the cloud
- **After Sync**: Displays all settings that were changed, showing:
  - Setting key
  - Old value (before sync)
  - New value (after sync)

### Error Handling

- If no configuration file is found in the library when clicking Sync, an English error message is displayed: "No valid configuration file found in the library. Please upload settings first using the 'Upload' button."

## How It Works

1. **Storage**: Settings are stored as a JSON file attached to a special document item in your Zotero library
2. **Synchronization**: Uses Zotero's existing cloud sync to sync the settings file across devices
3. **Application**: When you click "Sync", the plugin downloads the settings file and applies all preferences to your current Zotero installation
4. **Change Tracking**: The plugin tracks which settings actually changed, showing only meaningful differences

## Requirements

- Zotero 7.0 or later
- Zotero account with cloud sync enabled

## Building

To build the plugin from source:

```bash
cd syntero-plugin
./build.sh
```

This will create a `syntero-1.1.0.xpi` file that can be installed in Zotero.

## Project Structure

```
syntero-plugin/
├── manifest.json              # Plugin manifest
├── bootstrap.js               # Plugin entry point
├── build.sh                   # Build script
├── updates.json               # Update manifest
└── content/
    ├── include.js             # Namespace initialization
    ├── syntero-core.js        # Core plugin logic
    ├── syntero-preferences.js # Preference management
    ├── syntero-storage.js     # Cloud storage handling
    ├── syntero-sync.js        # Synchronization logic
    ├── syntero-ui.js          # UI components
    ├── syntero-dialog.xul     # Main sync dialog (unused, using alert-style)
    ├── syntero-changes-dialog.xul # Changes display dialog (unused, using alert-style)
    └── icons/                 # Plugin icons
        ├── syntero-icon-16.png
        ├── syntero-icon-24.png
        ├── syntero-icon-32.png
        └── syntero-icon-48.png
```

## Version History

### Version 1.1.0 (Current)

**New Features:**
- Added custom icon support (16x16, 24x24, 32x32, 48x48 pixels)
- Beautiful light blue styled toolbar button with hover effects
- Text alignment: Centered text in toolbar button
- Enhanced error handling: English error message when no configuration file found

**UI Improvements:**
- Reversed button order in sync dialog: Sync (left), Upload (middle), Cancel (right)
- Settings preview after upload: Shows all uploaded settings
- Change comparison after sync: Shows detailed list of changed settings with old/new values
- Improved button styling with better visual feedback

**Removed Features:**
- Removed automatic download feature (all sync operations are now manual)
- Removed automatic upload triggers (upload is always manual)

**Technical Changes:**
- Changed from XUL dialog windows to alert-style prompts for better compatibility
- Improved change tracking in deserialize function
- Enhanced upload function to return settings data for preview

### Version 1.0.0

**Initial Release:**
- Basic settings synchronization functionality
- Manual upload and sync operations
- Cloud storage using Zotero's sync infrastructure
- Toolbar button and menu integration
- Preferences pane injection

## License

AGPL-3.0

## Author

YU Shi Jiong

## Support

For issues and questions, please visit: https://github.com/EEExphon/Syntero-Plugin
