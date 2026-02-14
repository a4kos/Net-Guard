/**
 * 1. INITIALIZATION & LISTENERS
 * All listeners must be at the top level to ensure they are registered
 * immediately when the Service Worker wakes up.
 */

chrome.runtime.onInstalled.addListener(async () => {
  const initialState = {
    flaggedExtensions: {}, // keyed by extension id – prevents duplicate stacking
    lastScanTime: null,
    scanLogs: []
  };
  await chrome.storage.local.set(initialState);

  // Create the periodic alarm
  chrome.alarms.create("security_scan", { periodInMinutes: 5 });
  console.log("Net Guard initialized.");
});

// Handle the periodic alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "security_scan") {
    performPersistentScan();
  }
});

// Handle manual scan requests from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "START_SCAN") {
    performPersistentScan().then(() => {
      sendResponse({ status: "success" });
    });
    return true; // Keep channel open for async response
  }
});

/**
 * 2. CORE SCANNING LOGIC
 * All 'await' calls are wrapped inside this async function to prevent
 * "Top-level await" errors.
 */
async function performPersistentScan() {
  console.log("Starting security scan...");

  try {
    // A. Retrieve current data from storage
    const data = await chrome.storage.local.get([
      "flaggedExtensions",
      "scanLogs"
    ]);
    // flaggedExtensions is a map keyed by extension id – this prevents
    // the same extension from being listed multiple times across scans
    const flagged = data.flaggedExtensions || {};
    let logs = data.scanLogs || [];

    // B. Get all installed extensions
    const extensions = await chrome.management.getAll();
    let newThisRun = 0;

    // C. Define Risk Signatures
    const highRiskPerms = ["debugger", "proxy", "nativeMessaging"];
    const mediumRiskPerms = [
      "webRequest",
      "webRequestBlocking",
      "management",
      "tabCapture"
    ];

    // Track which extension ids are still installed & enabled so we can
    // clean up entries for extensions that have been removed/disabled
    const currentIds = new Set();

    for (const ext of extensions) {
      // Skip self and system apps
      if (ext.id === chrome.runtime.id || ext.installType === "admin") continue;
      if (!ext.enabled) continue;

      currentIds.add(ext.id);

      let riskScore = 0;
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
      }

      // Check specific APIs
      highRiskPerms.forEach((p) => {
        if (allPermissions.includes(p)) riskScore += 3;
      });
      mediumRiskPerms.forEach((p) => {
        if (allPermissions.includes(p)) riskScore += 1;
      });

      if (riskScore >= 4) {
        // Only count as "new" if we haven't flagged this extension before
        if (!flagged[ext.id]) {
          newThisRun++;
        }
        // Always update the entry (score may change if permissions change)
        flagged[ext.id] = {
          name: ext.name,
          riskScore: riskScore,
          permissions: allPermissions,
          detectedAt: flagged[ext.id]?.detectedAt || new Date().toISOString(),
          lastSeen: new Date().toISOString()
        };
      } else {
        // Extension no longer risky – remove it from flagged list
        delete flagged[ext.id];
      }
    }

    // Remove flagged entries for extensions that are no longer installed/enabled
    for (const id of Object.keys(flagged)) {
      if (!currentIds.has(id)) {
        delete flagged[id];
      }
    }

    // D. Update and Save Data
    logs.push({
      timestamp: new Date().toISOString(),
      found: newThisRun
    });

    if (logs.length > 10) logs.shift();

    await chrome.storage.local.set({
      flaggedExtensions: flagged,
      lastScanTime: new Date().toString(),
      scanLogs: logs
    });

    console.log(
      `Scan complete. ${Object.keys(flagged).length} total flagged, ${newThisRun} new this run.`
    );
  } catch (error) {
    console.error("Scan failed:", error);
  }
}
