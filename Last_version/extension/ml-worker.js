// Lightweight ML classifier for browser extension
const MODEL_CONFIG = {
  weights: null,
  means: [15, 1.5, 3, 150, 0.3, 0.3, 0.2, 0.2, 0.2, 7, 4, 0.4],
  stds: [10, 1, 2, 100, 0.3, 0.3, 0.2, 0.2, 0.2, 5, 3, 0.2]
};

self.onmessage = async (e) => {
  const threat = e.data;

  // Extract features
  const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  const features = [
    threat.score || 0,
    severityMap[threat.severity] || 1,
    threat.patterns?.length || 0,
    threat.code?.length || 0,
    threat.type?.includes("eval") ? 1 : 0,
    threat.type?.includes("fetch") ? 1 : 0,
    threat.code?.toLowerCase().includes("cookie") ? 1 : 0,
    threat.code?.includes("localStorage") ? 1 : 0,
    threat.code?.includes("atob") ? 1 : 0,
    (threat.code?.match(/\(/g) || []).length,
    (threat.code?.match(/\./g) || []).length,
    new Set(threat.code || "").size / Math.max(threat.code?.length || 1, 1)
  ];

  // Simple anomaly detection (z-score based)
  let anomalyScore = 0;
  features.forEach((val, i) => {
    const std = MODEL_CONFIG.stds[i] || 1; // Guard against division by zero
    const z = Math.abs((val - MODEL_CONFIG.means[i]) / std);
    anomalyScore += z > 2 ? z : 0;
  });

  const confidence = Math.min(anomalyScore / 10, 1);

  self.postMessage({
    is_threat: confidence > 0.5,
    confidence: confidence,
    risk_level: confidence > 0.7 ? "high" : confidence > 0.4 ? "medium" : "low"
  });
};
