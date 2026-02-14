/**
 * Background Service Adapter
 * Converts the extension's background.js logic to Electron
 * Runs in the main process or a dedicated worker window
 */

const { ipcMain, BrowserWindow } = require('electron');
const path = require('path');

class BackgroundService {
  constructor() {
    this.scanActive = false;
    this.totalThreats = 0;
    this.scanLogs = [];
    this.listeners = new Map();
  }

  /**
   * Initialize the background service
   */
  async initialize(store) {
    // Load persisted data
    const data = await this.getStorageData(store);
    this.totalThreats = data.totalThreats || 0;
    this.scanLogs = data.scanLogs || [];

    // Setup IPC handlers for this service
    this.setupIPCHandlers(store);

    console.log('[BackgroundService] Initialized');
  }

  /**
   * Setup IPC handlers for background tasks
   */
  setupIPCHandlers(store) {
    // Handle scan requests
    ipcMain.handle('background-start-scan', async (event) => {
      return this.performPersistentScan(store);
    });

    // Handle periodic scan creation
    ipcMain.handle('background-setup-periodic-scan', async (event, intervalMinutes) => {
      this.setupPeriodicScan(store, intervalMinutes);
      return { status: 'periodic-scan-started' };
    });

    // Get current statistics
    ipcMain.handle('background-get-stats', async (event) => {
      return {
        totalThreats: this.totalThreats,
        lastScanTime: store.get('lastScanTime'),
        scanLogs: this.scanLogs
      };
    });
  }

  /**
   * Perform security scan (adapted from background.js)
   */
  async performPersistentScan(store) {
    console.log('[BackgroundService] Starting security scan...');

    if (this.scanActive) {
      console.log('[BackgroundService] Scan already in progress');
      return { status: 'already-scanning' };
    }

    this.scanActive = true;

    try {
      // Get all installed extensions (from IPC)
      const extensions = await new Promise((resolve) => {
        ipcMain.handle('get-extensions-for-scan', async () => {
          // This will be called by the IPC handler
          resolve([]);
        });
      });

      let threatsFoundInThisScan = 0;

      // Risk signatures (from original background.js)
      const highRiskPerms = ['debugger', 'proxy', 'nativeMessaging'];
      const mediumRiskPerms = [
        'webRequest',
        'webRequestBlocking',
        'management',
        'tabCapture'
      ];

      // Analyze each extension
      for (const ext of extensions) {
        let riskScore = 0;
        const allPermissions = [
          ...(ext.permissions || []),
          ...(ext.hostPermissions || [])
        ];

        // Check for broad URL access
        if (
          allPermissions.includes('<all_urls>') ||
          allPermissions.includes('*://*/*')
        ) {
          riskScore += 3;
        }

        // Check specific APIs
        highRiskPerms.forEach((p) => {
          if (allPermissions.includes(p)) riskScore += 3;
        });
        mediumRiskPerms.forEach((p) => {
          if (allPermissions.includes(p)) riskScore += 1;
        });

        if (riskScore >= 4) {
          console.warn(`[Alert] High risk: ${ext.name}`);
          threatsFoundInThisScan++;
        }
      }

      // Update and persist data
      this.totalThreats += threatsFoundInThisScan;
      this.scanLogs.push({
        timestamp: new Date().toISOString(),
        found: threatsFoundInThisScan
      });

      // Keep only last 10 scans
      if (this.scanLogs.length > 10) {
        this.scanLogs.shift();
      }

      // Persist to store
      await new Promise((resolve) => {
        store.set({
          totalThreats: this.totalThreats,
          lastScanTime: new Date().toString(),
          scanLogs: this.scanLogs
        });
        resolve();
      });

      console.log(`[BackgroundService] Scan complete. ${threatsFoundInThisScan} threats found.`);

      // Notify renderer of scan completion
      this.notifyRenderers('scan-complete', {
        threatsFound: threatsFoundInThisScan,
        totalThreats: this.totalThreats
      });

      return {
        status: 'success',
        threatsFound: threatsFoundInThisScan,
        totalThreats: this.totalThreats
      };
    } catch (error) {
      console.error('[BackgroundService] Scan failed:', error);
      return { status: 'error', error: error.message };
    } finally {
      this.scanActive = false;
    }
  }

  /**
   * Setup periodic scanning (replaces chrome.alarms)
   */
  setupPeriodicScan(store, intervalMinutes = 5) {
    const intervalMs = intervalMinutes * 60 * 1000;

    setInterval(() => {
      this.performPersistentScan(store);
    }, intervalMs);

    console.log(`[BackgroundService] Periodic scan scheduled every ${intervalMinutes} minutes`);
  }

  /**
   * Get storage data
   */
  async getStorageData(store) {
    return {
      totalThreats: store.get('totalThreats', 0),
      scanLogs: store.get('scanLogs', []),
      lastScanTime: store.get('lastScanTime', null)
    };
  }

  /**
   * Notify all renderer processes of events
   */
  notifyRenderers(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      win.webContents.send(channel, data);
    });
  }

  /**
   * Register a custom message listener
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  /**
   * Emit a custom event
   */
  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach((callback) => {
        callback(data);
      });
    }
  }
}

module.exports = BackgroundService;
