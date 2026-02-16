const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Storage API (chrome.storage.local replacement)
  storageGet: (keys) => ipcRenderer.invoke("storage-get", keys),
  storageSet: (items) => ipcRenderer.invoke("storage-set", items),
  storageRemove: (keys) => ipcRenderer.invoke("storage-remove", keys),
  storageClear: () => ipcRenderer.invoke("storage-clear"),

  // Runtime messaging (chrome.runtime.sendMessage replacement)
  sendMessage: (message) => ipcRenderer.invoke("runtime-sendMessage", message),
  onMessage: (callback) => {
    ipcRenderer.on("runtime-message", (event, message) => callback(message));
  },

  // Extension management (chrome.management.getAll replacement)
  managementGetAll: () => ipcRenderer.invoke("chrome-management-getAll"),

  // Tabs API (chrome.tabs replacement)
  tabsCreate: (options) => ipcRenderer.invoke("tabs-create", options),

  // General IPC
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Create chrome API polyfill for backward compatibility
contextBridge.exposeInMainWorld("chrome", {
  storage: {
    local: {
      get: (keys) => ipcRenderer.invoke("storage-get", keys),
      set: (items) => ipcRenderer.invoke("storage-set", items),
      remove: (keys) => ipcRenderer.invoke("storage-remove", keys),
      clear: () => ipcRenderer.invoke("storage-clear")
    }
  },
  runtime: {
    sendMessage: (message, callback) => {
      ipcRenderer.invoke("runtime-sendMessage", message).then(callback);
    },
    onMessage: {
      addListener: (callback) => {
        ipcRenderer.on("runtime-message", (event, message) => {
          callback(message, {}, () => {});
        });
      }
    }
  },
  management: {
    getAll: () => ipcRenderer.invoke("chrome-management-getAll")
  },
  tabs: {
    create: (options, callback) => {
      ipcRenderer.invoke("tabs-create", options).then(callback);
    }
  }
});

console.log("Preload script loaded successfully");
