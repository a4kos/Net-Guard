const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { registerIPCHandlers } = require("./electron-adapter/ipc-handlers");
const BackgroundService = require("./electron-adapter/background-service");
const Store = require("electron-store");

let mainWindow;
let bgService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "electron-adapter", "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Existing loading code
  mainWindow.loadFile("dist/app.exe");
  // or: mainWindow.loadURL('http://localhost:5137');

  // Initialize Net Guard background service
  const store = new Store({
    name: "net-guard-storage",
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
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
