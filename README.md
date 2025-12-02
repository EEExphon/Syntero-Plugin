# Syntero - Zotero Settings Sync Plugin

A Zotero plugin that synchronizes your Zotero settings and preferences across multiple devices using Zotero's built-in cloud synchronization.

## Features

- **Manual Upload**: Upload your current Zotero settings to the cloud
- **Sync**: Download and apply settings from the cloud (overwrites current settings)
- **Cloud Storage**: Uses Zotero's existing cloud sync infrastructure
- **Device Management**: Tracks settings by device ID
- **Easy Access**: Toolbar button and menu item for quick access

## Installation

1. Download the latest `syntero-1.0.0.xpi` file
2. Open Zotero
3. Go to **Tools → Plugins**
4. Drag the `.xpi` file onto the Plugins window
5. Restart Zotero if prompted

## Usage

### Quick Sync Dialog

Click the **Syntero** button in the Zotero toolbar (or go to **Zotero → Tools → Syntero Settings...**) to open the sync dialog:

- **上传 (Upload)**: Uploads your current settings to the cloud
- **Sync**: Downloads and applies settings from the cloud (overwrites current settings)
- **Cancel**: Closes the dialog without any action

### Automatic Download (Optional)

You can enable automatic download checking in the Zotero preferences:

1. Go to **Zotero → Preferences → Sync**
2. Scroll to the **Syntero** section at the bottom
3. Check **"Enable automatic download"** to check for updates every 5 minutes

Note: Upload is always manual. You must click "Upload" or "Sync" to upload your settings.

## How It Works

1. **Storage**: Settings are stored as a JSON file attached to a special document item in your Zotero library
2. **Synchronization**: Uses Zotero's existing cloud sync to sync the settings file across devices
3. **Application**: When you click "Sync", the plugin downloads the settings file and applies all preferences to your current Zotero installation

## Requirements

- Zotero 7.0 or later
- Zotero account with cloud sync enabled

## Building

To build the plugin from source:

```bash
cd syntero-plugin
./build.sh
```

This will create a `syntero-1.0.0.xpi` file that can be installed in Zotero.

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
    └── syntero-ui.js          # UI components
```

## License

AGPL-3.0

## Author

YU Shi Jiong (22107027D)

## Support

For issues and questions, please visit: https://github.com/EEExphon/Syntero-Plugin
