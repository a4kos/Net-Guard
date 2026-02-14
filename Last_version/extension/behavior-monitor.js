// Behavioral analysis and anomaly detection
export class BehaviorMonitor {
  constructor() {
    this.behaviors = new Map()
    this.anomalies = []
  }

  // Track extension behavior
  trackBehavior(extensionId, behaviorType, data) {
    if (!this.behaviors.has(extensionId)) {
      this.behaviors.set(extensionId, {
        networkRequests: [],
        domModifications: [],
        storageAccess: [],
        apiCalls: [],
        startTime: Date.now(),
      })
    }

    const behavior = this.behaviors.get(extensionId)

    switch (behaviorType) {
      case "network":
        behavior.networkRequests.push(data)
        this.checkNetworkAnomaly(extensionId, data)
        break
      case "dom":
        behavior.domModifications.push(data)
        break
      case "storage":
        behavior.storageAccess.push(data)
        break
      case "api":
        behavior.apiCalls.push(data)
        this.checkApiAnomaly(extensionId, data)
        break
    }
  }

  // Check for network anomalies
  checkNetworkAnomaly(extensionId, data) {
    const behavior = this.behaviors.get(extensionId)
    const recentRequests = behavior.networkRequests.slice(-10)

    // Check for excessive requests
    if (recentRequests.length >= 10) {
      const timeSpan = recentRequests[9].timestamp - recentRequests[0].timestamp
      if (timeSpan < 5000) {
        // 10 requests in 5 seconds
        this.anomalies.push({
          extensionId,
          type: "excessive-network-requests",
          severity: "high",
          description: "Unusual number of network requests",
          timestamp: Date.now(),
        })
      }
    }

    // Check for suspicious domains
    const suspiciousDomains = [".tk", ".ml", ".ga", ".cf", ".gq"]
    if (suspiciousDomains.some((domain) => data.url.includes(domain))) {
      this.anomalies.push({
        extensionId,
        type: "suspicious-domain",
        severity: "high",
        description: `Request to suspicious domain: ${data.url}`,
        timestamp: Date.now(),
      })
    }

    // Check for data exfiltration patterns
    if (data.method === "POST" && data.bodySize > 10000) {
      this.anomalies.push({
        extensionId,
        type: "large-data-transfer",
        severity: "critical",
        description: `Large POST request (${data.bodySize} bytes)`,
        timestamp: Date.now(),
      })
    }
  }

  // Check for API abuse
  checkApiAnomaly(extensionId, data) {
    const sensitiveApis = ["chrome.cookies", "chrome.webRequest", "chrome.debugger", "chrome.tabs.executeScript"]

    if (sensitiveApis.some((api) => data.api.includes(api))) {
      this.anomalies.push({
        extensionId,
        type: "sensitive-api-usage",
        severity: "high",
        description: `Usage of sensitive API: ${data.api}`,
        timestamp: Date.now(),
      })
    }
  }

  // Get behavior summary for extension
  getBehaviorSummary(extensionId) {
    const behavior = this.behaviors.get(extensionId)
    if (!behavior) return null

    const runtime = Date.now() - behavior.startTime

    return {
      extensionId,
      runtime,
      networkRequestCount: behavior.networkRequests.length,
      domModificationCount: behavior.domModifications.length,
      storageAccessCount: behavior.storageAccess.length,
      apiCallCount: behavior.apiCalls.length,
      anomalyCount: this.anomalies.filter((a) => a.extensionId === extensionId).length,
    }
  }

  // Get all anomalies for extension
  getAnomalies(extensionId) {
    return this.anomalies.filter((a) => a.extensionId === extensionId)
  }

  // Clear old data
  cleanup(maxAge = 3600000) {
    // 1 hour
    const cutoff = Date.now() - maxAge
    this.anomalies = this.anomalies.filter((a) => a.timestamp > cutoff)
  }
}
