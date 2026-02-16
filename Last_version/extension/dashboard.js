/**
 * Net Guard Dashboard - Updated for Real Data
 * Connects to the data server and displays live scanning statistics
 */

// Configuration
const SERVER_URL = window.location.origin; // Use same origin as dashboard
let socket;
let threatChart, categoryChart;

// State Management
const state = {
  stats: {
    totalExtensions: 0,
    totalThreats: 0,
    criticalThreats: 0,
    highThreats: 0,
    mediumThreats: 0,
    lowThreats: 0,
    extensionsAtRisk: 0,
    lastScanTime: null
  },
  threats: [],
  extensions: [],
  threatHistory: [],
  currentFilter: "all"
};

/**
 * Initialize Dashboard
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Dashboard] Initializing...");

  initCharts();
  connectWebSocket();
  fetchInitialData();
  setupEventListeners();

  console.log("[Dashboard] Initialization complete");
});

/**
 * Initialize Chart.js Charts
 */
function initCharts() {
  // Threat Activity Line Chart
  const ctxThreat = document.getElementById("threatChart").getContext("2d");
  threatChart = new Chart(ctxThreat, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Critical",
          data: [],
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.4,
          fill: true
        },
        {
          label: "High",
          data: [],
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          tension: 0.4,
          fill: true
        },
        {
          label: "Medium",
          data: [],
          borderColor: "#eab308",
          backgroundColor: "rgba(234, 179, 8, 0.1)",
          tension: 0.4,
          fill: true
        },
        {
          label: "Low",
          data: [],
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // We have custom legend in HTML
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });

  // Threat Category Doughnut Chart
  const ctxCat = document.getElementById("categoryChart").getContext("2d");
  categoryChart = new Chart(ctxCat, {
    type: "doughnut",
    data: {
      labels: ["Critical", "High", "Medium", "Low"],
      datasets: [
        {
          data: [0, 0, 0, 0],
          backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e"],
          borderWidth: 2,
          borderColor: "#fff"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Connect to WebSocket Server
 */
function connectWebSocket() {
  console.log("[Dashboard] Connecting to WebSocket...");

  socket = io(SERVER_URL);

  socket.on("connect", () => {
    console.log("[Dashboard] WebSocket connected");
    updateConnectionStatus(true);
  });

  socket.on("disconnect", () => {
    console.log("[Dashboard] WebSocket disconnected");
    updateConnectionStatus(false);
  });

  socket.on("initial_data", (data) => {
    console.log("[Dashboard] Received initial data:", data);

    if (data.stats) {
      state.stats = data.stats;
      state.threats = data.stats.threats || [];
      state.extensions = data.stats.extensions || [];
      updateAllUI();
    }

    if (data.history) {
      state.threatHistory = data.history;
      updateCharts();
    }
  });

  socket.on("new_threat", (threat) => {
    console.log("[Dashboard] New threat received:", threat);
    handleNewThreat(threat);
  });

  socket.on("scan_complete", (data) => {
    console.log("[Dashboard] Scan complete:", data);
    fetchInitialData(); // Refresh all data
    showNotification("Scan Complete", `Found ${data.totalThreats} threats`);
  });
}

/**
 * Fetch Initial Data from REST API
 */
async function fetchInitialData() {
  console.log("[Dashboard] Fetching initial data...");

  try {
    // Fetch stats
    const statsRes = await fetch(`${SERVER_URL}/api/stats`);
    const stats = await statsRes.json();
    state.stats = stats;

    // Fetch threats
    const threatsRes = await fetch(`${SERVER_URL}/api/threats`);
    const threats = await threatsRes.json();
    state.threats = threats;

    // Fetch extensions
    const extensionsRes = await fetch(`${SERVER_URL}/api/extensions`);
    const extensions = await extensionsRes.json();
    state.extensions = extensions;

    // Fetch threat history
    const historyRes = await fetch(`${SERVER_URL}/api/threat-history`);
    const history = await historyRes.json();
    state.threatHistory = history;

    // Update all UI elements
    updateAllUI();
    updateCharts();

    console.log("[Dashboard] Initial data loaded successfully");
  } catch (error) {
    console.error("[Dashboard] Failed to fetch initial data:", error);
    showError("Failed to load data. Make sure the server is running.");
  }
}

/**
 * Update All UI Elements
 */
function updateAllUI() {
  updateStatCards();
  updateThreatFeed();
  updateExtensionsList();
}

/**
 * Update Stat Cards
 */
function updateStatCards() {
  document.getElementById("totalExtensions").textContent =
    state.stats.extensions || 0;
  document.getElementById("totalThreats").textContent = state.stats.total || 0;
  document.getElementById("criticalThreats").textContent =
    state.stats.critical || 0;
  document.getElementById("extensionsAtRisk").textContent =
    state.stats.extensionsAtRisk || 0;

  // Update threat change indicator
  const threatChange = document.getElementById("threatChange");
  if (state.stats.total > 0) {
    threatChange.innerHTML = "<span>⚠️ Active threats detected!</span>";
    threatChange.classList.add("negative");
  } else {
    threatChange.innerHTML = "<span>✓ No threats detected</span>";
    threatChange.classList.remove("negative");
  }
}

/**
 * Update Threat Feed
 */
function updateThreatFeed() {
  const feed = document.getElementById("threatFeed");
  feed.innerHTML = "";

  // Filter threats based on current filter
  let filteredThreats = state.threats;
  if (state.currentFilter !== "all") {
    filteredThreats = state.threats.filter(
      (t) => t.severity === state.currentFilter
    );
  }

  if (filteredThreats.length === 0) {
    feed.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <p>No threats detected</p>
        <span>Your extensions are secure</span>
      </div>
    `;
    return;
  }

  // Display threats (most recent first)
  filteredThreats.slice(0, 50).forEach((threat) => {
    const threatCard = createThreatCard(threat);
    feed.appendChild(threatCard);
  });
}

/**
 * Create Threat Card Element
 */
function createThreatCard(threat) {
  const card = document.createElement("div");
  card.className = `threat-item severity-${threat.severity}`;

  const timestamp = threat.timestamp
    ? new Date(threat.timestamp).toLocaleString()
    : "Unknown time";

  card.innerHTML = `
    <div class="threat-info">
      <h3>${threat.type || "Unknown Threat"}</h3>
      <p>Extension: ${threat.extensionName || threat.extensionId || "Unknown"}</p>
      <small>${timestamp}</small>
    </div>
    <div class="threat-actions">
      <span class="badge badge-${threat.severity}">${threat.severity}</span>
      <button onclick="viewThreatDetails('${threat.id || Math.random()}')">View Details</button>
    </div>
  `;

  // Store threat data on element for later retrieval
  card.dataset.threatData = JSON.stringify(threat);

  return card;
}

/**
 * Update Extensions List
 */
function updateExtensionsList() {
  const list = document.getElementById("extensionsList");
  list.innerHTML = "";

  if (state.extensions.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <p>No extensions monitored yet</p>
        <span>Run a scan to see extensions</span>
      </div>
    `;
    return;
  }

  // Display extensions
  state.extensions.forEach((ext) => {
    const extCard = createExtensionCard(ext);
    list.appendChild(extCard);
  });
}

/**
 * Create Extension Card Element
 */
function createExtensionCard(ext) {
  const card = document.createElement("div");

  // Determine risk level
  let riskLevel = "low";
  let riskColor = "#22c55e";

  if (ext.riskScore >= 4) {
    riskLevel = "critical";
    riskColor = "#ef4444";
  } else if (ext.riskScore >= 3) {
    riskLevel = "high";
    riskColor = "#f97316";
  } else if (ext.riskScore >= 2) {
    riskLevel = "medium";
    riskColor = "#eab308";
  }

  card.className = `extension-item risk-${riskLevel}`;
  card.style.borderLeft = `4px solid ${riskColor}`;

  card.innerHTML = `
    <div class="extension-header">
      <h4>${ext.name || "Unknown Extension"}</h4>
      <span class="badge badge-${riskLevel}">${riskLevel.toUpperCase()}</span>
    </div>
    <div class="extension-details">
      <p><strong>Version:</strong> ${ext.version || "Unknown"}</p>
      <p><strong>Permissions:</strong> ${ext.permissionCount || 0}</p>
      <p><strong>Risk Score:</strong> ${ext.riskScore || 0}</p>
    </div>
  `;

  return card;
}

/**
 * Update Charts with Current Data
 */
function updateCharts() {
  // Update line chart with threat history
  if (state.threatHistory.length > 0) {
    const labels = state.threatHistory.map((h) => h.time);
    const criticalData = state.threatHistory.map((h) => h.critical);
    const highData = state.threatHistory.map((h) => h.high);
    const mediumData = state.threatHistory.map((h) => h.medium);
    const lowData = state.threatHistory.map((h) => h.low);

    threatChart.data.labels = labels;
    threatChart.data.datasets[0].data = criticalData;
    threatChart.data.datasets[1].data = highData;
    threatChart.data.datasets[2].data = mediumData;
    threatChart.data.datasets[3].data = lowData;
    threatChart.update();
  }

  // Update doughnut chart with current threat distribution
  categoryChart.data.datasets[0].data = [
    state.stats.critical || 0,
    state.stats.high || 0,
    state.stats.medium || 0,
    state.stats.low || 0
  ];
  categoryChart.update();
}

/**
 * Handle New Threat (Real-time)
 */
function handleNewThreat(threat) {
  // Add to state
  state.threats.unshift(threat);

  // Update counters
  state.stats.total++;
  if (threat.severity === "critical") state.stats.critical++;
  else if (threat.severity === "high") state.stats.high++;
  else if (threat.severity === "medium") state.stats.medium++;
  else if (threat.severity === "low") state.stats.low++;

  // Update UI
  updateStatCards();
  updateThreatFeed();
  updateCharts();

  // Show notification
  showNotification(
    "New Threat Detected",
    `${threat.type} - ${threat.severity}`
  );
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Refresh extensions button
  const refreshBtn = document.getElementById("refreshExtensions");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      console.log("[Dashboard] Manual refresh requested");
      fetchInitialData();
    });
  }

  // Filter buttons
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active state
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update filter
      state.currentFilter = btn.dataset.severity;
      updateThreatFeed();
    });
  });

  // Modal close
  const closeModal = document.getElementById("closeModal");
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      document.getElementById("threatModal").classList.remove("active");
    });
  }
}

/**
 * View Threat Details in Modal
 */
window.viewThreatDetails = (threatId) => {
  // Find threat in state
  const threat = state.threats.find((t) => t.id === threatId);

  if (!threat) {
    console.error("[Dashboard] Threat not found:", threatId);
    return;
  }

  const modal = document.getElementById("threatModal");
  const detailsBody = document.getElementById("threatDetails");

  detailsBody.innerHTML = `
    <div class="detail-section">
      <h4>Threat Information</h4>
      <p><strong>Type:</strong> ${threat.type || "Unknown"}</p>
      <p><strong>Severity:</strong> <span class="badge badge-${threat.severity}">${threat.severity}</span></p>
      <p><strong>Extension:</strong> ${threat.extensionName || threat.extensionId || "Unknown"}</p>
      <p><strong>Detected:</strong> ${threat.timestamp ? new Date(threat.timestamp).toLocaleString() : "Unknown"}</p>
    </div>
    
    ${
      threat.ai_analysis
        ? `
    <div class="detail-section">
      <h4>AI Security Analysis</h4>
      <p class="ai-text">${threat.ai_analysis}</p>
    </div>
    `
        : ""
    }
    
    ${
      threat.patterns && threat.patterns.length > 0
        ? `
    <div class="detail-section">
      <h4>Signatures Triggered</h4>
      <ul>${threat.patterns.map((p) => `<li>${p}</li>`).join("")}</ul>
    </div>
    `
        : ""
    }
    
    ${
      threat.ml_confidence
        ? `
    <div class="detail-section">
      <h4>ML Confidence Score</h4>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${threat.ml_confidence * 100}%"></div>
      </div>
      <span>${(threat.ml_confidence * 100).toFixed(1)}% Certainty</span>
    </div>
    `
        : ""
    }
    
    ${
      threat.code
        ? `
    <div class="detail-section">
      <h4>Code Snippet</h4>
      <pre><code>${escapeHtml(threat.code)}</code></pre>
    </div>
    `
        : ""
    }
    
    ${
      threat.description
        ? `
    <div class="detail-section">
      <h4>Description</h4>
      <p>${threat.description}</p>
    </div>
    `
        : ""
    }
  `;

  modal.classList.add("active");
};

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Update Connection Status Indicator
 */
function updateConnectionStatus(connected) {
  const statusIndicator = document.getElementById("connectionStatus");
  const statusDot = statusIndicator.querySelector(".status-dot");
  const statusText = statusIndicator.querySelector(".status-text");

  if (connected) {
    statusDot.style.backgroundColor = "#22c55e";
    statusText.textContent = "Connected";
  } else {
    statusDot.style.backgroundColor = "#ef4444";
    statusText.textContent = "Disconnected";
  }
}

/**
 * Show Notification
 */
function showNotification(title, message) {
  // Simple console notification for now
  console.log(`[Notification] ${title}: ${message}`);

  // You can implement a toast notification here
  // For now, we'll just log it
}

/**
 * Show Error
 */
function showError(message) {
  console.error("[Dashboard] Error:", message);

  // You can implement an error UI here
  alert(message);
}

// Export for debugging
window.dashboardState = state;
window.refreshDashboard = fetchInitialData;
