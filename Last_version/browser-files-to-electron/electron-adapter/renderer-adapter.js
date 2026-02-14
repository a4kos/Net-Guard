/**
 * Renderer Process Adapter
 * Bridges extension renderer code (popup.js, content.js) to Electron
 */

/**
 * Wraps the extension's popup.js logic for Electron
 * Your existing popup.js can use this with minimal changes
 */
class PopupAdapter {
  constructor() {
    this.isElectron = () => {
      return (
        typeof window !== "undefined" &&
        window.chrome?.runtime?.id === "electron-netguard"
      );
    };
  }

  async getDOMElements() {
    return {
      scannedEl: document.getElementById("scanned"),
      detectedEl: document.getElementById("detected"),
      timeEl: document.getElementById("last-scan-time"),
      container: document.getElementById("threat-container"),
      scanBtn: document.getElementById("scan-now-btn"),
      dashboardBtn: document.getElementById("open-dashboard-btn")
    };
  }

  async loadData() {
    const data = await window.chrome.storage.local.get([
      "totalThreats",
      "scanLogs",
      "lastScanTime"
    ]);
    return data;
  }

  async updateUI(data) {
    const elements = await this.getDOMElements();

    if (!elements.detectedEl) return;

    // Update counters
    elements.detectedEl.textContent = data.totalThreats || 0;
    elements.scannedEl.textContent = data.scanLogs ? data.scanLogs.length : 0;

    // Update timestamp
    if (data.lastScanTime) {
      const date = new Date(data.lastScanTime);
      elements.timeEl.textContent = `Last scan: ${date.toLocaleTimeString()}`;
    }

    // Update threat list
    this.renderThreatList(data.scanLogs || [], elements.container);
  }

  renderThreatList(logs, container) {
    if (logs.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No threats detected yet.</div>';
      return;
    }

    container.innerHTML = "";
    logs
      .slice()
      .reverse()
      .forEach((log) => {
        if (log.found > 0) {
          const div = document.createElement("div");

          let severity = "low";
          if (log.found > 3) severity = "critical";
          else if (log.found > 1) severity = "medium";

          div.className = `threat ${severity}`;
          div.innerHTML = `
            <div class="threat-type">Detection: ${log.found} Potential Threats</div>
            <div class="threat-time">${new Date(log.timestamp).toLocaleString()}</div>
          `;
          container.appendChild(div);
        }
      });

    if (container.innerHTML === "") {
      container.innerHTML =
        '<div class="empty-state">System secure. No threats found in recent scans.</div>';
    }
  }

  async setupEventListeners() {
    const elements = await this.getDOMElements();

    if (elements.scanBtn) {
      elements.scanBtn.addEventListener("click", async () => {
        elements.scanBtn.disabled = true;
        elements.scanBtn.innerHTML =
          '<span class="loading-spinner"></span>Scanning...';

        try {
          await window.chrome.runtime.sendMessage({ type: "START_SCAN" });
          setTimeout(() => {
            location.reload();
          }, 2000);
        } catch (error) {
          console.error("Scan error:", error);
          elements.scanBtn.disabled = false;
          elements.scanBtn.innerHTML = "Scan Now";
        }
      });
    }

    if (elements.dashboardBtn) {
      elements.dashboardBtn.addEventListener("click", () => {
        // In Electron, open the dashboard window or navigate
        if (window.location.pathname !== "/dashboard") {
          window.location.href = "/dashboard";
        }
      });
    }
  }

  async initialize() {
    const data = await this.loadData();
    await this.updateUI(data);
    await this.setupEventListeners();

    // Listen for scan completion
    if (window.electronAPI) {
      window.electronAPI.onMessage("scan-complete", async (event) => {
        const newData = await this.loadData();
        await this.updateUI(newData);
      });
    }
  }
}

/**
 * Content Script Adapter
 * Bridges extension content.js to Electron window injection
 */
class ContentScriptAdapter {
  static injectScript(scriptPath) {
    const script = document.createElement("script");
    script.src = scriptPath;
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  static forwardSecuritySignal(event) {
    // Forward SECURITY_SIGNAL from injected scripts to the background service
    window.addEventListener("SECURITY_SIGNAL", (signalEvent) => {
      if (window.chrome && window.chrome.runtime) {
        window.chrome.runtime.sendMessage({
          type: "THREAT_DETECTED",
          details: signalEvent.detail
        });
      }
    });
  }
}

/**
 * Pattern Detector Adapter
 * Can be used as-is in Electron with ES6 module export
 */
const PatternDetectorAdapter = {
  analyzeExtension: async (extension) => {
    /**
     * Analyze extension for threats using imported pattern detector
     * This can be called in the main process or renderer
     */
    let riskScore = 0;
    const allPermissions = [
      ...(extension.permissions || []),
      ...(extension.hostPermissions || [])
    ];

    const highRiskPerms = ["debugger", "proxy", "nativeMessaging"];
    const mediumRiskPerms = [
      "webRequest",
      "webRequestBlocking",
      "management",
      "tabCapture"
    ];

    // Score based on permissions
    if (
      allPermissions.includes("<all_urls>") ||
      allPermissions.includes("*://*/*")
    ) {
      riskScore += 3;
    }

    highRiskPerms.forEach((p) => {
      if (allPermissions.includes(p)) riskScore += 3;
    });
    mediumRiskPerms.forEach((p) => {
      if (allPermissions.includes(p)) riskScore += 1;
    });

    return {
      id: extension.id,
      name: extension.name,
      riskScore,
      isThreat: riskScore >= 4
    };
  }
};

// Export adapters
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PopupAdapter,
    ContentScriptAdapter,
    PatternDetectorAdapter
  };
}

// Or expose globally for use in HTML pages
if (typeof window !== "undefined") {
  window.RendererAdapter = {
    PopupAdapter,
    ContentScriptAdapter,
    PatternDetectorAdapter
  };
}
