/**
 * Chrome API Adapter for Electron
 * Replaces Chrome extension APIs with Electron's IPC and native capabilities
 */

const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ChromeAPIAdapter {
  constructor() {
    this.messageListeners = new Map();
    this.alarmListeners = [];
    this.storageData = {};
    this.alarmIntervals = new Map();
  }

  /**
   * chrome.runtime.onInstalled → Electron app initialization
   * In Electron, this fires when the app is first loaded
   */
  get runtime() {
    return {
      onInstalled: {
        addListener: (callback) => {
          // Wrap callback so it fires on app start or extension reload
          if (!window.__alreadyInitialized) {
            window.__alreadyInitialized = true;
            callback({ reason: 'install' });
          }
        }
      },
      onMessage: {
        addListener: (callback) => {
          ipcRenderer.on('chrome-runtime-message', (event, request, sender) => {
            callback(request, sender, (response) => {
              // Send response back to main process
              event.sender.send('chrome-runtime-response', response);
            });
          });
        }
      },
      sendMessage: (message, callback) => {
        ipcRenderer.invoke('chrome-runtime-sendMessage', message).then(callback);
      },
      id: 'electron-netguard'
    };
  }

  /**
   * chrome.storage.local → Electron Store or localStorage
   * Persists data between sessions
   */
  get storage() {
    return {
      local: {
        get: async (keys) => {
          return new Promise((resolve) => {
            ipcRenderer.invoke('chrome-storage-get', keys).then(resolve);
          });
        },
        set: async (data) => {
          return new Promise((resolve) => {
            ipcRenderer.invoke('chrome-storage-set', data).then(resolve);
          });
        },
        remove: async (keys) => {
          return new Promise((resolve) => {
            ipcRenderer.invoke('chrome-storage-remove', keys).then(resolve);
          });
        }
      }
    };
  }

  /**
   * chrome.alarms → SetInterval-based timers
   * Schedules periodic tasks like security scans
   */
  get alarms() {
    return {
      create: (name, alarmInfo) => {
        const periodInMinutes = alarmInfo.periodInMinutes || 5;
        const intervalMs = periodInMinutes * 60 * 1000;

        // Clear any existing alarm
        if (this.alarmIntervals.has(name)) {
          clearInterval(this.alarmIntervals.get(name));
        }

        // Create new interval
        const intervalId = setInterval(() => {
          this.alarmListeners.forEach((callback) => {
            callback({ name });
          });
        }, intervalMs);

        this.alarmIntervals.set(name, intervalId);
      },
      onAlarm: {
        addListener: (callback) => {
          this.alarmListeners.push(callback);
        }
      }
    };
  }

  /**
   * chrome.management.getAll → Electron native module to scan extensions
   * Returns list of installed extensions from Chrome/Edge/Brave
   */
  get management() {
    return {
      getAll: async () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke('chrome-management-getAll')
            .then(resolve)
            .catch(reject);
        });
      }
    };
  }

  /**
   * chrome.tabs → Window/tab management in Electron
   */
  get tabs() {
    return {
      create: (createProperties) => {
        ipcRenderer.send('chrome-tabs-create', createProperties);
      },
      executeScript: (tabId, details) => {
        ipcRenderer.send('chrome-tabs-executeScript', { tabId, details });
      }
    };
  }

  /**
   * For listening to extension-specific messages
   */
  onSecuritySignal(callback) {
    ipcRenderer.on('SECURITY_SIGNAL', (event, detail) => {
      callback(detail);
    });
  }

  /**
   * Cleanup on window close
   */
  cleanup() {
    this.alarmIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.alarmIntervals.clear();
  }
}

// Export adapter instance
const chromeAPI = new ChromeAPIAdapter();
window.chrome = chromeAPI;

module.exports = chromeAPI;
