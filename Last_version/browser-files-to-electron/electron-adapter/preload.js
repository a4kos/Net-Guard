/**
 * Electron Preload Script
 * Securely exposes Chrome API adapter to renderer process
 */

const { contextBridge, ipcRenderer } = require("electron");

// Allowed IPC channels for security
const VALID_SEND_CHANNELS = ["tabs-create", "tabs-executeScript"];
const VALID_INVOKE_CHANNELS = [
  "runtime-sendMessage",
  "storage-get",
  "storage-set",
  "storage-remove",
  "alarms-create",
  "management-getAll"
];
const VALID_RECEIVE_CHANNELS = [
  "runtime-onInstalled",
  "runtime-onMessage",
  "alarms-onAlarm"
];

// Create a secure bridge for Chrome APIs
contextBridge.exposeInMainWorld("chrome", {
  // runtime API
  runtime: {
    onInstalled: {
      addListener: (callback) => {
        ipcRenderer.on("runtime-onInstalled", (_event, detail) => {
          callback(detail);
        });
      }
    },
    onMessage: {
      addListener: (callback) => {
        ipcRenderer.on("runtime-onMessage", (_event, request) => {
          callback(request, { id: "electron-netguard" }, (response) => {
            ipcRenderer.send("runtime-onMessage-response", response);
          });
        });
      }
    },
    sendMessage: (message, callback) => {
      ipcRenderer
        .invoke("runtime-sendMessage", message)
        .then((result) => {
          if (typeof callback === "function") callback(result);
        })
        .catch((err) => {
          console.error("[Net Guard Preload] sendMessage error:", err);
          if (typeof callback === "function") callback(undefined);
        });
    },
    id: "electron-netguard"
  },

  // storage API
  storage: {
    local: {
      get: (keys) => ipcRenderer.invoke("storage-get", keys),
      set: (data) => ipcRenderer.invoke("storage-set", data),
      remove: (keys) => ipcRenderer.invoke("storage-remove", keys)
    }
  },

  // alarms API
  alarms: {
    create: (name, alarmInfo) =>
      ipcRenderer.invoke("alarms-create", name, alarmInfo),
    onAlarm: {
      addListener: (callback) => {
        ipcRenderer.on("alarms-onAlarm", (_event, alarm) => {
          callback(alarm);
        });
      }
    }
  },

  // management API
  management: {
    getAll: () => ipcRenderer.invoke("management-getAll")
  },

  // tabs API
  tabs: {
    create: (createProperties) => {
      if (VALID_SEND_CHANNELS.includes("tabs-create")) {
        ipcRenderer.send("tabs-create", createProperties);
      }
    },
    executeScript: (tabId, details) => {
      if (VALID_SEND_CHANNELS.includes("tabs-executeScript")) {
        ipcRenderer.send("tabs-executeScript", tabId, details);
      }
    }
  }
});

// Expose a utility for custom IPC messages with channel validation
contextBridge.exposeInMainWorld("electronAPI", {
  sendMessage: (channel, data) => {
    if (VALID_SEND_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  onMessage: (channel, callback) => {
    if (VALID_RECEIVE_CHANNELS.includes(channel)) {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on(channel, handler);
      // Return a cleanup function
      return () => ipcRenderer.removeListener(channel, handler);
    }
    return () => {};
  }
});
