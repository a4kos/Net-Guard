// 1. Initialize Socket.IO
const socket = io();

// 2. State Management for Charts
let threatChart, categoryChart;
const stats = {
  critical: 0,
  high: 0,
  medium: 0,
  low: 0
};

// 3. Initialize Charts on Page Load
document.addEventListener("DOMContentLoaded", () => {
  initCharts();
  fetchInitialData();
});

function initCharts() {
  const ctxThreat = document.getElementById("threatChart").getContext("2d");
  threatChart = new Chart(ctxThreat, {
    type: "line",
    data: {
      labels: [], // Timestamps
      datasets: [
        {
          label: "Threat Severity Score",
          data: [],
          borderColor: "#6366f1",
          tension: 0.4,
          fill: true,
          backgroundColor: "rgba(99, 102, 241, 0.1)"
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctxCat = document.getElementById("categoryChart").getContext("2d");
  categoryChart = new Chart(ctxCat, {
    type: "doughnut",
    data: {
      labels: ["Critical", "High", "Medium", "Low"],
      datasets: [
        {
          data: [0, 0, 0, 0],
          backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e"]
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// 4. Handle Real-time Socket Events
socket.on("new_threat", (threat) => {
  console.log("New threat received:", threat);
  updateStats(threat);
  appendThreatToFeed(threat);
  updateCharts(threat);
  showNotification(threat);
});

function updateStats(threat) {
  // Update the UI counters
  const totalThreatsElem = document.getElementById("totalThreats");
  totalThreatsElem.innerText = parseInt(totalThreatsElem.innerText) + 1;

  if (threat.severity === "critical") {
    const critElem = document.getElementById("criticalThreats");
    critElem.innerText = parseInt(critElem.innerText) + 1;
  }
}

function appendThreatToFeed(threat) {
  const feed = document.getElementById("threatFeed");

  // Remove empty state if it exists
  const emptyState = feed.querySelector(".empty-state");
  if (emptyState) emptyState.remove();

  const threatCard = document.createElement("div");
  threatCard.className = `threat-item severity-${threat.severity}`;
  threatCard.innerHTML = `
        <div class="threat-info">
            <h3>${threat.type.toUpperCase()}</h3>
            <p>Extension: ${threat.extensionId || "Unknown ID"}</p>
            <small>${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="threat-actions">
            <span class="badge badge-${threat.severity}">${
    threat.severity
  }</span>
            <button onclick='viewDetails(${JSON.stringify(
              threat
            )})'>View Details</button>
        </div>
    `;
  feed.prepend(threatCard);
}

// 5. Initial Data Fetch (on refresh)
async function fetchInitialData() {
  try {
    const response = await fetch("/api/threats");
    const data = await response.json();
    data.forEach((threat) => appendThreatToFeed(threat));

    const statsRes = await fetch("/api/stats");
    const statsData = await statsRes.json();
    document.getElementById("totalExtensions").innerText = statsData.extensions;
    document.getElementById("totalThreats").innerText = statsData.total;
    document.getElementById("criticalThreats").innerText = statsData.critical;
  } catch (err) {
    console.error("Failed to fetch initial stats:", err);
  }
}

// 6. Modal Controls
window.viewDetails = (threat) => {
  const modal = document.getElementById("threatModal");
  const detailsBody = document.getElementById("threatDetails");

  detailsBody.innerHTML = `
        <div class="detail-section">
            <h4>AI Security Analysis</h4>
            <p class="ai-text">${threat.ai_analysis}</p>
        </div>
        <div class="detail-section">
            <h4>Signatures Triggered</h4>
            <ul>${threat.patterns.map((p) => `<li>${p}</li>`).join("")}</ul>
        </div>
        <div class="detail-section">
            <h4>ML Confidence Score</h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${
                  threat.ml_confidence * 100
                }%"></div>
            </div>
            <span>${(threat.ml_confidence * 100).toFixed(1)}% Certainty</span>
        </div>
        <div class="detail-section">
            <h4>Raw Code Snippet</h4>
            <pre><code>${threat.code || "No code provided"}</code></pre>
        </div>
    `;
  modal.classList.add("active");
};

document.getElementById("closeModal").onclick = () => {
  document.getElementById("threatModal").classList.remove("active");
};
