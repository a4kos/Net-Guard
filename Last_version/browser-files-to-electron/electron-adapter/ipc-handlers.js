/**
 * Electron Main Process IPC Handlers
 * Handles all communication from renderer process and manages Electron-specific tasks
 */

const { ipcMain, app, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Store = require("electron-store");

// Initialize persistent storage
const store = new Store({
  name: "net-guard-storage",
  defaults: {
    totalThreats: 0,
    scanLogs: [],
    lastScanTime: null
  }
});

/**
 * Register all IPC handlers
 */
function registerIPCHandlers() {
  // Storage API
  ipcMain.handle("chrome-storage-get", async (event, keys) => {
    const result = {};
    if (Array.isArray(keys)) {
      keys.forEach((key) => {
        result[key] = store.get(key);
      });
    } else {
      result[keys] = store.get(keys);
    }
    return result;
  });

  ipcMain.handle("chrome-storage-set", async (event, data) => {
    Object.entries(data).forEach(([key, value]) => {
      store.set(key, value);
    });
    return {};
  });

  ipcMain.handle("chrome-storage-remove", async (event, keys) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach((key) => {
      store.delete(key);
    });
    return {};
  });

  // Management API - Scan installed extensions
  ipcMain.handle("chrome-management-getAll", async (event) => {
    return getInstalledExtensions();
  });

  // Tabs API
  ipcMain.on("chrome-tabs-create", (event, createProperties) => {
    const url = createProperties.url;
    shell.openExternal(url);
  });

  // Runtime messages
  ipcMain.handle("chrome-runtime-sendMessage", async (event, message) => {
    // Handle background task messages
    if (message.type === "START_SCAN") {
      return { status: "success" };
    }
    return {};
  });
}

/**
 * Get installed extensions from Chrome, Edge, and Brave
 */
async function getInstalledExtensions() {
  const extensions = [];
  const platform = process.platform;
  let extensionPaths = [];

  // Determine extension paths by platform
  if (platform === "win32") {
    extensionPaths = [
      path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Google",
        "Chrome",
        "User Data",
        "Default",
        "Extensions"
      ),
      path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Microsoft",
        "Edge",
        "User Data",
        "Default",
        "Extensions"
      ),
      path.join(
        os.homedir(),
        "AppData",
        "Local",
        "BraveSoftware",
        "Brave-Browser",
        "User Data",
        "Default",
        "Extensions"
      )
    ];
  } else if (platform === "darwin") {
    extensionPaths = [
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Google",
        "Chrome",
        "Default",
        "Extensions"
      ),
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Microsoft Edge",
        "Default",
        "Extensions"
      ),
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "BraveSoftware",
        "Brave-Browser",
        "Default",
        "Extensions"
      )
    ];
  } else {
    // Linux
    extensionPaths = [
      path.join(
        os.homedir(),
        ".config",
        "google-chrome",
        "Default",
        "Extensions"
      ),
      path.join(
        os.homedir(),
        ".config",
        "microsoft-edge",
        "Default",
        "Extensions"
      ),
      path.join(
        os.homedir(),
        ".config",
        "BraveSoftware",
        "Brave-Browser",
        "Default",
        "Extensions"
      )
    ];
  }

  // Scan each path for extensions
  for (const extensionPath of extensionPaths) {
    if (!fs.existsSync(extensionPath)) continue;

    try {
      const extensionIds = fs.readdirSync(extensionPath);
      for (const extId of extensionIds) {
        const extDir = path.join(extensionPath, extId);
        const manifestPath = path.join(extDir, "manifest.json");

        // Try to read manifest
        try {
          const manifestContent = fs.readFileSync(manifestPath, "utf-8");
          const manifest = JSON.parse(manifestContent);

          extensions.push({
            id: extId,
            name: manifest.name || "Unknown",
            version: manifest.version || "0.0.0",
            description: manifest.description || "",
            enabled: true, // Assume enabled if present
            permissions: manifest.permissions || [],
            hostPermissions: manifest.host_permissions || [],
            installType: "normal",
            // Analyze permissions for risk
            permissionCount:
              (manifest.permissions || []).length +
              (manifest.host_permissions || []).length
          });
        } catch (err) {
          // Skip if manifest can't be parsed
        }
      }
    } catch (err) {
      // Skip if directory can't be read
    }
  }

  return extensions;
}

/**
 * Export functions for use in main.js
 */
module.exports = {
  registerIPCHandlers,
  getInstalledExtensions,
  store
};
