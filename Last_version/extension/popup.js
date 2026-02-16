document.addEventListener("DOMContentLoaded", async () => {
  const scannedEl = document.getElementById("scanned");
  const detectedEl = document.getElementById("detected");
  const timeEl = document.getElementById("last-scan-time");
  const container = document.getElementById("threat-container");
  const scanBtn = document.getElementById("scan-now-btn");
  const dashboardBtn = document.getElementById("open-dashboard-btn");

  // Guard against missing DOM elements
  if (
    !scannedEl ||
    !detectedEl ||
    !timeEl ||
    !container ||
    !scanBtn ||
    !dashboardBtn
  ) {
    console.error("[Net Guard] Required DOM elements not found.");
    return;
  }

  // Declare the chrome variable
  const chrome = window.chrome;

  // 1. Fetch data from storage
  const data = await chrome.storage.local.get([
    "flaggedExtensions",
    "scanLogs",
    "lastScanTime"
  ]);

  // 2. Update the counter stats
  // Use the deduplicated flaggedExtensions map for the real threat count
  const flagged = data.flaggedExtensions || {};
  const uniqueThreatCount = Object.keys(flagged).length;
  detectedEl.textContent = uniqueThreatCount;
  scannedEl.textContent = data.scanLogs ? data.scanLogs.length : 0;

  // 3. Update the timestamp
  if (data.lastScanTime) {
    const date = new Date(data.lastScanTime);
    timeEl.textContent = `Last scan: ${date.toLocaleTimeString()}`;
  }

  // 4. Dashboard Button - opens the web dashboard in a new tab
  const DASHBOARD_URL = "https://netguard.noit.eu";

  dashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
  });

  // 5. Scan Button
  scanBtn.addEventListener("click", async () => {
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="loading-spinner"></span>Scanning...';

    chrome.runtime.sendMessage({ type: "START_SCAN" }, () => {
      // Reload popup UI after scan completes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    });
  });

  // 6. Render the threat list using unique flagged extensions (not raw scan logs)
  // This prevents the same extension from being listed multiple times across scans
  const flaggedEntries = Object.values(flagged);

  if (flaggedEntries.length === 0) {
    container.innerHTML =
      '<div class="empty-state">System secure. No threats found in recent scans.</div>';
    return;
  }

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  // Sort by risk score descending so worst threats show first
  flaggedEntries
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
    .forEach((entry) => {
      const div = document.createElement("div");

      let severity = "low";
      if (entry.riskScore >= 6) severity = "critical";
      else if (entry.riskScore >= 4) severity = "medium";

      div.className = `threat ${severity}`;
      div.innerHTML = `
        <div class="threat-type">${entry.name || "Unknown Extension"}</div>
        <div class="threat-time">Risk score: ${entry.riskScore} &middot; ${new Date(entry.detectedAt).toLocaleString()}</div>
      `;
      fragment.appendChild(div);
    });

  container.appendChild(fragment);
});
1;
