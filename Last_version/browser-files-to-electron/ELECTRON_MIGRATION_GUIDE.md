# Net Guard Browser Extension → Electron App Migration Guide

This guide explains how to adapt your Chrome extension to work as an Electron desktop app that scans system-wide installed extensions.

## Architecture Overview

### Browser Extension Model
```
popup.html/js ←→ chrome.runtime ←→ background.js
content.js ←→ inject.js
```

### Electron Model
```
Renderer Process (popup) ←→ IPC ←→ Main Process (background service)
                                    └→ System extension scanner
```

## Key Changes Required

### 1. Chrome API Replacements

| Extension API | Electron Equivalent |
|---|---|
| `chrome.storage.local` | `electron-store` + IPC |
| `chrome.alarms` | `setInterval` in main process |
| `chrome.management.getAll()` | Native file system scanning + IPC |
| `chrome.tabs.create()` | `shell.openExternal()` |
| `chrome.runtime.onMessage` | `ipcMain` / `ipcRenderer` |

### 2. File Structure

```
electron-adapter/
├── main.js                 # Electron app entry point
├── preload.js             # Context bridge for secure IPC
├── ipc-handlers.js        # Main process IPC handlers
├── background-service.js  # Background task logic
├── chrome-api-adapter.js  # Chrome API compatibility layer
├── renderer-adapter.js    # Popup & content script adapters
└── package.json           # Dependencies

Your existing files:
├── popup.html → Keep as is, load in BrowserWindow
├── popup.js → Use PopupAdapter wrapper
├── background.js → Converted to background-service.js
├── content.js → Use ContentScriptAdapter
├── pattern-detector.js → Copy to shared location
├── behavior-monitor.js → Copy to shared location
└── ml-worker.js → Copy to shared location
```

## Step-by-Step Migration

### Step 1: Update Your Popup (popup.js)

**Before (Extension)**
```javascript
document.addEventListener("DOMContentLoaded", async () => {
  const data = await chrome.storage.local.get(["totalThreats", "scanLogs", "lastScanTime"]);
  // ... update UI
});

document.getElementById("scan-now-btn").addEventListener("click", async () => {
  chrome.runtime.sendMessage({ type: "START_SCAN" }, (response) => {
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  });
});
```

**After (Electron)**
```javascript
// At the top of your HTML file, add:
<script src="renderer-adapter.js"></script>

// Then in your popup.js:
document.addEventListener("DOMContentLoaded", async () => {
  const popupAdapter = new window.RendererAdapter.PopupAdapter();
  await popupAdapter.initialize();
});
```

Or keep your original code as-is since the `chrome` API is polyfilled via preload.js.

### Step 2: Update Your Background Service

**Before (Extension)**
```javascript
chrome.runtime.onInstalled.addListener(async () => {
  const initialState = { totalThreats: 0, lastScanTime: null, scanLogs: [] };
  await chrome.storage.local.set(initialState);
  chrome.alarms.create("security_scan", { periodInMinutes: 5 });
});

async function performPersistentScan() {
  const extensions = await chrome.management.getAll();
  // ... scan logic
}
```

**After (Electron - in main.js)**
```javascript
const { app, BrowserWindow } = require('electron');
const BackgroundService = require('./background-service');
const { registerIPCHandlers, store } = require('./ipc-handlers');

let bgService;

function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Initialize background service
  bgService = new BackgroundService();
  bgService.initialize(store);
  
  // Setup periodic scanning (replaces chrome.alarms)
  bgService.setupPeriodicScan(store, 5); // Every 5 minutes
  
  registerIPCHandlers();
  mainWindow.loadFile('dist/index.html');
}

app.on('ready', createWindow);
```

### Step 3: Copy Core Analysis Files

These files work as-is in Electron with minimal changes:

```bash
# Copy these files to your Electron project
cp pattern-detector.js electron-adapter/
cp behavior-monitor.js electron-adapter/
cp ml-worker.js electron-adapter/
```

**In your HTML, load the ML worker:**
```javascript
// In your scanning logic
const worker = new Worker('/ml-worker.js');
worker.postMessage(threatData);
worker.onmessage = (e) => {
  console.log('ML Analysis:', e.data);
};
```

### Step 4: Handle Extension Scanning

Your extension scanner needs to access the native file system:

```javascript
// In ipc-handlers.js - already implemented
ipcMain.handle('chrome-management-getAll', async (event) => {
  return getInstalledExtensions(); // Scans Chrome/Edge/Brave folders
});

// From your popup, call it:
const extensions = await window.chrome.management.getAll();
```

The adapter automatically detects:
- **Windows**: Chrome, Edge, Brave from AppData
- **macOS**: Extensions from Library/Application Support
- **Linux**: Extensions from .config folders

### Step 5: Handle Content Scripts & Injection

If you need to inject code into browsers:

**Before (Extension)**
```javascript
const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
(document.head || document.documentElement).appendChild(script);
```

**After (Electron - if needed for monitoring)**
```javascript
// In renderer-adapter.js
ContentScriptAdapter.injectScript('/path/to/inject.js');

// Listen for security signals
ContentScriptAdapter.forwardSecuritySignal((event) => {
  window.chrome.runtime.sendMessage({
    type: 'THREAT_DETECTED',
    details: event.detail
  });
});
```

## Running the Electron App

### Development

```bash
# Install dependencies
npm install

# Start development
npm run dev

# This runs:
# 1. React dev server on localhost:3000
# 2. Electron app loading from localhost:3000
```

### Production Build

```bash
# Build React + Electron binaries
npm run build

# Creates installers for:
# - Windows (.exe)
# - macOS (.dmg)
# - Linux (.AppImage)
```

## Key Differences to Handle

### 1. **Data Persistence**
- Extension uses `chrome.storage.local` → IPC + electron-store
- Automatically persisted between sessions

### 2. **Permissions**
- Extension requires manifest permissions → Electron doesn't need them
- Can freely access file system, system info, etc.

### 3. **Alarms/Timers**
- Extension uses `chrome.alarms` → Use `setInterval` in main process
- Runs continuously, doesn't wake-up like service workers

### 4. **Browser Integration**
- Extension runs in browser context → Electron is a standalone app
- Can still open browsers with `shell.openExternal(url)`

### 5. **Security Considerations**
```javascript
// Electron best practices (already in provided files)
webPreferences: {
  nodeIntegration: false,      // Never enable
  contextIsolation: true,      // Always enable
  preload: '/path/to/preload', // Use for secure APIs
  sandbox: true                 // Enable sandbox
}
```

## Testing Checklist

- [ ] Popup loads and displays threat data
- [ ] "Scan Now" button triggers scan
- [ ] Threat list updates after scan
- [ ] Periodic scanning runs every 5 minutes
- [ ] Data persists after app restart
- [ ] Extensions from Chrome/Edge/Brave detected
- [ ] Risk scoring matches original extension
- [ ] Links to dashboard work (if using one)
- [ ] UI responsive and styled correctly

## Troubleshooting

### "Cannot find module 'electron-store'"
```bash
npm install electron-store
```

### "chrome is not defined in renderer"
Check preload.js is loaded correctly:
```javascript
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true
}
```

### Extensions not detected
Check file paths for your platform:
- Windows: `C:\Users\[User]\AppData\Local\Google\Chrome\User Data\Default\Extensions`
- macOS: `~/Library/Application Support/Google/Chrome/Default/Extensions`
- Linux: `~/.config/google-chrome/Default/Extensions`

### IPC timeout errors
Ensure handlers are registered before window loads:
```javascript
const mainWindow = new BrowserWindow(...);
registerIPCHandlers();  // Must be before loadFile/loadURL
mainWindow.loadFile(...);
```

## Advanced: Using Your Existing Desktop App

If you already have a desktop app:

1. **Add IPC handlers to your main process** (from ipc-handlers.js)
2. **Add background service** (background-service.js)
3. **Add preload script** (preload.js)
4. **Use renderer adapter** (renderer-adapter.js) in your UI

Then in your app:
```javascript
// Trigger a scan
const result = await window.chrome.runtime.sendMessage({ type: 'START_SCAN' });

// Get statistics
const stats = await window.chrome.storage.local.get(['totalThreats', 'scanLogs']);

// Listen for periodic scan results
window.electronAPI.onMessage('scan-complete', (data) => {
  console.log('Scan found', data.threatsFound, 'threats');
  updateUI(data);
});
```

## Next Steps

1. Copy adapter files to your Electron project
2. Update your popup.js to use the adapter (or keep as-is with preload)
3. Initialize BackgroundService in main.js
4. Test with `npm run dev`
5. Build with `npm run build`

The extension logic is preserved - only the Chrome APIs are replaced with Electron equivalents!
