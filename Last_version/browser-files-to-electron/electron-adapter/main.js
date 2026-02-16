const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev =
  process.env.NODE_ENV === "development" || process.argv.includes("--dev");

// Import electron-adapter modules
const BackgroundService = require("./electron-adapter/background-service");
const {
  registerIPCHandlers,
  store
} = require("./electron-adapter/ipc-handlers");

let mainWindow = null;
let bgService = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    title: "Net Guard",
    icon: path.join(__dirname, "public", "icon.png")
  });

  // Register IPC handlers before loading content
  registerIPCHandlers();

  // Initialize background service
  bgService = new BackgroundService();
  bgService.initialize(store);

  // Setup periodic scanning (every 5 minutes)
  bgService.setupPeriodicScan(store, 5);

  // Load the Next.js app
  if (isDev) {
    // Development: load from Next.js dev server
    mainWindow.loadURL("http://netguard.noit.eu");
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from exported static files
    mainWindow.loadFile(path.join(__dirname, "out", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle app quit
app.on("before-quit", () => {
  if (bgService) {
    bgService.cleanup();
  }
});

// Export for debugging
module.exports = { mainWindow };
