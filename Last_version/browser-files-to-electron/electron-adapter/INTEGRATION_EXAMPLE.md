# Integration Example: Adding Net Guard to Your Existing Electron App

This shows how to integrate the extension threat detector into your existing Electron desktop app.

## Option 1: Quick Integration (5 minutes)

Add the Net Guard scanner as a feature in your existing app:

### 1. Update your main.js

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { registerIPCHandlers } = require('./electron-adapter/ipc-handlers');
const BackgroundService = require('./electron-adapter/background-service');
const Store = require('electron-store');

let mainWindow;
let bgService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-adapter', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Your existing loading code
  mainWindow.loadFile('dist/index.html');
  // or: mainWindow.loadURL('http://localhost:3000');

  // ADD THIS: Initialize Net Guard background service
  const store = new Store({
    name: 'net-guard-storage',
    defaults: {
      totalThreats: 0,
      scanLogs: [],
      lastScanTime: null
    }
  });

  registerIPCHandlers();
  
  bgService = new BackgroundService();
  bgService.initialize(store);
  bgService.setupPeriodicScan(store, 5); // Scan every 5 minutes

  mainWindow.webContents.openDevTools();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 2. Add a Net Guard Panel to Your React App

```jsx
// components/NetGuardPanel.jsx
import React, { useEffect, useState } from 'react';

export function NetGuardPanel() {
  const [stats, setStats] = useState({
    totalThreats: 0,
    lastScanTime: null,
    scanLogs: []
  });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Load initial stats
    loadStats();

    // Listen for scan completion
    if (window.electronAPI) {
      window.electronAPI.onMessage('scan-complete', (data) => {
        console.log('Scan complete:', data);
        loadStats();
        setScanning(false);
      });
    }
  }, []);

  async function loadStats() {
    try {
      const data = await window.chrome.storage.local.get([
        'totalThreats',
        'scanLogs',
        'lastScanTime'
      ]);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function handleScan() {
    setScanning(true);
    try {
      await window.chrome.runtime.sendMessage({ type: 'START_SCAN' });
      // Stats will auto-update via 'scan-complete' event
    } catch (error) {
      console.error('Scan failed:', error);
      setScanning(false);
    }
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>🛡️ Net Guard - Extension Security Monitor</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0' }}>
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Threats Detected</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: stats.totalThreats > 0 ? '#d32f2f' : '#4caf50' }}>
            {stats.totalThreats}
          </div>
        </div>

        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Scans Performed</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>
            {stats.scanLogs?.length || 0}
          </div>
        </div>
      </div>

      {stats.lastScanTime && (
        <div style={{ fontSize: '14px', color: '#666', margin: '10px 0' }}>
          Last scan: {new Date(stats.lastScanTime).toLocaleString()}
        </div>
      )}

      <button
        onClick={handleScan}
        disabled={scanning}
        style={{
          padding: '10px 20px',
          background: scanning ? '#ccc' : '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: scanning ? 'not-allowed' : 'pointer',
          fontSize: '14px'
        }}
      >
        {scanning ? 'Scanning...' : 'Scan Now'}
      </button>

      {stats.scanLogs && stats.scanLogs.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Recent Scans</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {stats.scanLogs.slice().reverse().map((log, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px',
                  marginBottom: '5px',
                  background: log.found > 0 ? '#ffebee' : '#f1f8e9',
                  borderLeft: `4px solid ${log.found > 3 ? '#d32f2f' : log.found > 0 ? '#f57c00' : '#4caf50'}`,
                  borderRadius: '3px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: log.found > 0 ? '#d32f2f' : '#4caf50' }}>
                  {log.found} threat{log.found !== 1 ? 's' : ''} found
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Add to Your Main App Layout

```jsx
// App.jsx or main page
import { NetGuardPanel } from './components/NetGuardPanel';

export default function App() {
  return (
    <div>
      {/* Your existing content */}
      <div>Existing App Content</div>

      {/* Add Net Guard panel */}
      <NetGuardPanel />
    </div>
  );
}
```

## Option 2: Full Integration (Dashboard Tab)

Create a dedicated dashboard for extension monitoring:

```jsx
// pages/SecurityDashboard.jsx
import React, { useEffect, useState } from 'react';
import { NetGuardPanel } from '../components/NetGuardPanel';
import { ExtensionList } from '../components/ExtensionList';

export function SecurityDashboard() {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExtensions();
  }, []);

  async function loadExtensions() {
    setLoading(true);
    try {
      const exts = await window.chrome.management.getAll();
      
      // Analyze each with pattern detector
      const analyzed = exts.map(ext => {
        let riskScore = 0;
        const allPerms = [...(ext.permissions || []), ...(ext.hostPermissions || [])];
        
        if (allPerms.includes('<all_urls>') || allPerms.includes('*://*/*')) {
          riskScore += 3;
        }
        
        const highRisk = ['debugger', 'proxy', 'nativeMessaging'];
        const mediumRisk = ['webRequest', 'webRequestBlocking', 'management'];
        
        highRisk.forEach(p => allPerms.includes(p) && (riskScore += 3));
        mediumRisk.forEach(p => allPerms.includes(p) && (riskScore += 1));
        
        return {
          ...ext,
          riskScore,
          riskLevel: riskScore >= 4 ? 'critical' : riskScore >= 2 ? 'medium' : 'low'
        };
      });
      
      setExtensions(analyzed);
    } catch (error) {
      console.error('Failed to load extensions:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>🔒 Security Dashboard</h1>
      
      <NetGuardPanel />
      
      <div style={{ marginTop: '40px' }}>
        <h2>Installed Extensions</h2>
        {loading ? (
          <p>Loading extensions...</p>
        ) : (
          <div>
            <p style={{ color: '#666' }}>Found {extensions.length} extensions</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {extensions.map(ext => (
                <div
                  key={ext.id}
                  style={{
                    padding: '15px',
                    border: `2px solid ${ext.riskLevel === 'critical' ? '#d32f2f' : ext.riskLevel === 'medium' ? '#f57c00' : '#4caf50'}`,
                    borderRadius: '8px',
                    background: '#fafafa'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0' }}>{ext.name}</h3>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                    v{ext.version}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '12px' }}>
                    Permissions: {ext.permissionCount}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: 'white',
                      background: ext.riskLevel === 'critical' ? '#d32f2f' : ext.riskLevel === 'medium' ? '#f57c00' : '#4caf50'
                    }}
                  >
                    {ext.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Option 3: System Tray Integration

Add a system tray icon for quick scanning:

```javascript
// In main.js
const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');

let tray;

function createWindow() {
  // ... existing code

  // Create tray icon
  const icon = path.join(__dirname, 'assets', 'icon.png'); // You need an icon
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quick Scan',
      click: async () => {
        ipcMain.emit('quick-scan');
        mainWindow.webContents.send('start-scan');
      }
    },
    {
      label: 'Show Dashboard',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/security');
      }
    },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Handle quick scan
ipcMain.on('quick-scan', async () => {
  const result = await bgService.performPersistentScan(store);
  tray.setToolTip(`Net Guard: ${result.totalThreats} threats detected`);
});
```

## Testing the Integration

```bash
# 1. Install dependencies (if not already done)
npm install electron electron-store

# 2. Copy adapter files
cp -r electron-adapter/ your-app/

# 3. Update main.js with integration code

# 4. Start the app
npm start

# 5. Test in your UI:
# - Click "Scan Now"
# - Check if threat count increases
# - Verify data persists after app restart
# - Check that periodic scans run every 5 minutes
```

## What Gets Added to Your App

### Storage
- New `net-guard-storage` store file (persists threats data)

### IPC Channels (Available to your renderer)
- `chrome.management.getAll()` - Get installed extensions
- `chrome.storage.local.get/set` - Persist data
- `chrome.runtime.sendMessage()` - Trigger scans
- `scan-complete` - Listen for scan completion

### Data Structure
```javascript
{
  totalThreats: 5,           // Cumulative threat count
  lastScanTime: "2024-01-15T10:30:00.000Z",
  scanLogs: [
    {
      timestamp: "2024-01-15T10:30:00.000Z",
      found: 2  // Threats found in this scan
    }
  ]
}
```

## Troubleshooting

**Q: "chrome is not defined"**
A: Make sure preload.js is loaded in webPreferences and contextIsolation is true.

**Q: Extensions not detected**
A: Check the extension folder paths for your OS. They vary between Windows, Mac, and Linux.

**Q: IPC calls timing out**
A: Ensure registerIPCHandlers() is called before loadFile/loadURL.

**Q: Data not persisting**
A: Install electron-store: `npm install electron-store`

That's it! Your existing Electron app now has enterprise-grade extension security monitoring! 🎉
