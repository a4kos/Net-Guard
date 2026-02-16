/**
 * Background Service Adapter - Updated for Web Dashboard Integration
 * Converts the extension's background.js logic to Electron
 * Runs in the main process and sends data to the web dashboard
 */

const { ipcMain, BrowserWindow } = require("electron");
const path = require("path");
const https = require("https");
const http = require("http");

class BackgroundService {
  constructor() {
    this.scanActive = false;
    this.totalThreats = 0;
    this.scanLogs = [];
    this.listeners = new Map();

    // Dashboard server configuration
    this.dashboardURL = process.env.DASHBOARD_URL || "http://localhost:3001";
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

    console.log("[BackgroundService] Initialized");
    console.log("[BackgroundService] Dashboard URL:", this.dashboardURL);
  }

  /**
   * Setup IPC handlers for background tasks
   */
  setupIPCHandlers(store) {
    // Handle scan requests
    ipcMain.handle("background-start-scan", async (event) => {
      return this.performPersistentScan(store);
    });

    // Handle periodic scan creation
    ipcMain.handle(
      "background-setup-periodic-scan",
      async (event, intervalMinutes) => {
        this.setupPeriodicScan(store, intervalMinutes);
        return { status: "periodic-scan-started" };
      }
    );

    // Get current statistics
    ipcMain.handle("background-get-stats", async (event) => {
      return {
        totalThreats: this.totalThreats,
        lastScanTime: store.get("lastScanTime"),
        scanLogs: this.scanLogs
      };
    });
  }

  /**
   * Perform security scan (adapted from background.js)
   */
  async performPersistentScan(store) {
    console.log("[BackgroundService] Starting security scan...");

    if (this.scanActive) {
      console.log("[BackgroundService] Scan already in progress");
      return { status: "already-scanning" };
    }

    this.scanActive = true;

    try {
      // Get all installed extensions via IPC
      const extensions = await this.getInstalledExtensions();

      console.log(
        `[BackgroundService] Found ${extensions.length} extensions to scan`
      );

      let threatsFoundInThisScan = 0;
      const threats = [];
      const analyzedExtensions = [];

      // Risk signatures (from original background.js)
      const highRiskPerms = ["debugger", "proxy", "nativeMessaging"];
      const mediumRiskPerms = [
        "webRequest",
        "webRequestBlocking",
        "management",
        "tabCapture"
      ];

      // Analyze each extension
      for (const ext of extensions) {
        let riskScore = 0;
        const riskFactors = [];
        const allPermissions = [
          ...(ext.permissions || []),
          ...(ext.hostPermissions || [])
        ];

        // Check for broad URL access
        if (
          allPermissions.includes("<all_urls>") ||
          allPermissions.includes("*://*/*")
        ) {
          riskScore += 3;
          riskFactors.push("Broad URL access");
        }

        // Check specific APIs
        highRiskPerms.forEach((p) => {
          if (allPermissions.includes(p)) {
            riskScore += 3;
            riskFactors.push(`High-risk permission: ${p}`);
          }
        });

        mediumRiskPerms.forEach((p) => {
          if (allPermissions.includes(p)) {
            riskScore += 1;
            riskFactors.push(`Medium-risk permission: ${p}`);
          }
        });

        // Add analyzed extension to list
        analyzedExtensions.push({
          id: ext.id,
          name: ext.name,
          version: ext.version,
          description: ext.description,
          enabled: ext.enabled,
          permissions: ext.permissions || [],
          hostPermissions: ext.hostPermissions || [],
          permissionCount: allPermissions.length,
          riskScore: riskScore,
          riskFactors: riskFactors
        });

        // If high risk, create a threat object
        if (riskScore >= 4) {
          console.warn(`[Alert] High risk: ${ext.name} (Score: ${riskScore})`);
          threatsFoundInThisScan++;

          const threat = {
            id: `threat-${Date.now()}-${ext.id}`,
            type: "High-Risk Extension",
            severity: riskScore >= 6 ? "critical" : "high",
            extensionId: ext.id,
            extensionName: ext.name,
            riskScore: riskScore,
            patterns: riskFactors,
            timestamp: new Date().toISOString(),
            description: `Extension "${ext.name}" has a risk score of ${riskScore} due to dangerous permissions.`,
            ai_analysis: this.generateAIAnalysis(ext, riskScore, riskFactors),
            ml_confidence: 0.85 + riskScore / 100 // Simulated ML confidence
          };

          threats.push(threat);

          // Send threat to dashboard in real-time
          this.sendThreatToDashboard(threat);
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

      console.log(
        `[BackgroundService] Scan complete. ${threatsFoundInThisScan} threats found.`
      );

      // Send complete scan results to dashboard
      this.sendScanResultsToDashboard(analyzedExtensions, threats);

      // Notify renderer of scan completion
      this.notifyRenderers("scan-complete", {
        threatsFound: threatsFoundInThisScan,
        totalThreats: this.totalThreats
      });

      return {
        status: "success",
        threatsFound: threatsFoundInThisScan,
        totalThreats: this.totalThreats,
        extensions: analyzedExtensions,
        threats: threats
      };
    } catch (error) {
      console.error("[BackgroundService] Scan failed:", error);
      return { status: "error", error: error.message };
    } finally {
      this.scanActive = false;
    }
  }

  /**
   * Get installed extensions
   */
  async getInstalledExtensions() {
    return new Promise((resolve) => {
      ipcMain.handle("get-extensions-for-scan", async () => {
        // This will be handled by the ipc-handlers module
        return [];
      });

      // Call the ipc-handlers function directly
      const { getInstalledExtensions } = require("./ipc-handlers");
      getInstalledExtensions()
        .then(resolve)
        .catch(() => resolve([]));
    });
  }

  /**
   * Generate AI analysis text for threat
   */
  generateAIAnalysis(extension, riskScore, riskFactors) {
    const severity =
      riskScore >= 6 ? "critical" : riskScore >= 4 ? "high" : "medium";

    let analysis = `This extension "${extension.name}" has been flagged as ${severity} risk. `;

    if (riskFactors.length > 0) {
      analysis += `Key concerns include: ${riskFactors.join(", ")}. `;
    }

    if (riskScore >= 6) {
      analysis +=
        "Immediate action recommended. Consider disabling or removing this extension.";
    } else if (riskScore >= 4) {
      analysis +=
        "Review the extension's permissions and behavior carefully before continuing use.";
    } else {
      analysis += "Monitor this extension for unusual activity.";
    }

    return analysis;
  }

  /**
   * Send individual threat to dashboard (real-time)
   */
  sendThreatToDashboard(threat) {
    const url = `${this.dashboardURL}/api/threat-detected`;
    const data = JSON.stringify(threat);

    const urlObj = new URL(url);
    const protocol = urlObj.protocol === "https:" ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length
      }
    };

    const req = protocol.request(options, (res) => {
      console.log(
        `[BackgroundService] Threat sent to dashboard: ${res.statusCode}`
      );
    });

    req.on("error", (error) => {
      console.error(
        "[BackgroundService] Failed to send threat to dashboard:",
        error.message
      );
    });

    req.write(data);
    req.end();
  }

  /**
   * Send complete scan results to dashboard
   */
  sendScanResultsToDashboard(extensions, threats) {
    const url = `${this.dashboardURL}/api/scan-complete`;
    const data = JSON.stringify({
      extensions: extensions,
      threats: threats,
      scanTime: new Date().toISOString()
    });

    const urlObj = new URL(url);
    const protocol = urlObj.protocol === "https:" ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length
      }
    };

    const req = protocol.request(options, (res) => {
      console.log(
        `[BackgroundService] Scan results sent to dashboard: ${res.statusCode}`
      );
    });

    req.on("error", (error) => {
      console.error(
        "[BackgroundService] Failed to send scan results to dashboard:",
        error.message
      );
    });

    req.write(data);
    req.end();
  }

  /**
   * Setup periodic scanning (replaces chrome.alarms)
   */
  setupPeriodicScan(store, intervalMinutes = 5) {
    const intervalMs = intervalMinutes * 60 * 1000;

    setInterval(() => {
      console.log("[BackgroundService] Running periodic scan...");
      this.performPersistentScan(store);
    }, intervalMs);

    console.log(
      `[BackgroundService] Periodic scan scheduled every ${intervalMinutes} minutes`
    );
  }

  /**
   * Get storage data
   */
  async getStorageData(store) {
    return {
      totalThreats: store.get("totalThreats", 0),
      scanLogs: store.get("scanLogs", []),
      lastScanTime: store.get("lastScanTime", null)
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

  /**
   * Cleanup
   */
  cleanup() {
    console.log("[BackgroundService] Cleanup...");
  }
}

module.exports = BackgroundService;
