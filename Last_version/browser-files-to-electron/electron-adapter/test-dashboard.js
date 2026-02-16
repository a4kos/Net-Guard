/**
 * Test Script for Net Guard Dashboard
 * Simulates the Electron app sending scan data to the server
 */

const http = require("http");

const SERVER_URL = "http://localhost:3001";

/**
 * Send HTTP request
 */
function sendRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SERVER_URL}${endpoint}`);
    const postData = JSON.stringify(data);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": postData.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log(`✓ ${endpoint} - Status: ${res.statusCode}`);
        resolve(JSON.parse(responseData));
      });
    });

    req.on("error", (error) => {
      console.error(`✗ ${endpoint} - Error:`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Generate sample extensions
 */
function generateSampleExtensions() {
  return [
    {
      id: "ext-001",
      name: "AdBlock Plus",
      version: "3.14.0",
      description: "Blocks ads on websites",
      enabled: true,
      permissions: ["tabs", "storage", "webRequest"],
      hostPermissions: ["<all_urls>"],
      permissionCount: 4,
      riskScore: 3,
      riskFactors: ["Broad URL access"]
    },
    {
      id: "ext-002",
      name: "Suspicious Extension",
      version: "1.0.0",
      description: "Unknown functionality",
      enabled: true,
      permissions: [
        "debugger",
        "proxy",
        "tabs",
        "storage",
        "webRequest",
        "webRequestBlocking"
      ],
      hostPermissions: ["<all_urls>", "*://*/*"],
      permissionCount: 8,
      riskScore: 9,
      riskFactors: [
        "Broad URL access",
        "High-risk permission: debugger",
        "High-risk permission: proxy",
        "Medium-risk permission: webRequest",
        "Medium-risk permission: webRequestBlocking"
      ]
    },
    {
      id: "ext-003",
      name: "Dark Reader",
      version: "4.9.58",
      description: "Dark mode for every website",
      enabled: true,
      permissions: ["storage", "tabs"],
      hostPermissions: ["<all_urls>"],
      permissionCount: 3,
      riskScore: 3,
      riskFactors: ["Broad URL access"]
    },
    {
      id: "ext-004",
      name: "Grammarly",
      version: "14.1089.0",
      description: "Grammar and spell checker",
      enabled: true,
      permissions: ["storage", "tabs", "cookies"],
      hostPermissions: ["<all_urls>"],
      permissionCount: 4,
      riskScore: 3,
      riskFactors: ["Broad URL access"]
    },
    {
      id: "ext-005",
      name: "Malicious Extension",
      version: "1.0.0",
      description: "Steals user data",
      enabled: true,
      permissions: [
        "debugger",
        "proxy",
        "nativeMessaging",
        "tabs",
        "storage",
        "cookies",
        "webRequest",
        "management"
      ],
      hostPermissions: ["<all_urls>", "*://*/*"],
      permissionCount: 10,
      riskScore: 12,
      riskFactors: [
        "Broad URL access",
        "High-risk permission: debugger",
        "High-risk permission: proxy",
        "High-risk permission: nativeMessaging",
        "Medium-risk permission: webRequest",
        "Medium-risk permission: management"
      ]
    }
  ];
}

/**
 * Generate sample threats
 */
function generateSampleThreats(extensions) {
  const threats = [];

  extensions.forEach((ext) => {
    if (ext.riskScore >= 4) {
      const severity =
        ext.riskScore >= 10
          ? "critical"
          : ext.riskScore >= 6
            ? "high"
            : ext.riskScore >= 4
              ? "medium"
              : "low";

      threats.push({
        id: `threat-${Date.now()}-${ext.id}`,
        type: "High-Risk Extension",
        severity: severity,
        extensionId: ext.id,
        extensionName: ext.name,
        riskScore: ext.riskScore,
        patterns: ext.riskFactors,
        timestamp: new Date().toISOString(),
        description: `Extension "${ext.name}" has a risk score of ${ext.riskScore} due to dangerous permissions.`,
        ai_analysis: `This extension "${ext.name}" has been flagged as ${severity} risk. Key concerns include: ${ext.riskFactors.join(", ")}. ${
          severity === "critical"
            ? "Immediate action recommended. Consider disabling or removing this extension."
            : severity === "high"
              ? "Review the extension's permissions and behavior carefully before continuing use."
              : "Monitor this extension for unusual activity."
        }`,
        ml_confidence: 0.85 + ext.riskScore / 100,
        code: `// Sample code from ${ext.name}\nchrome.tabs.executeScript({\n  code: 'document.body.innerHTML = "";'\n});`
      });
    }
  });

  return threats;
}

/**
 * Run test simulation
 */
async function runTest() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Net Guard Dashboard - Test Simulation");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Test 1: Send complete scan
    console.log("Test 1: Sending complete scan data...");
    const extensions = generateSampleExtensions();
    const threats = generateSampleThreats(extensions);

    await sendRequest("/api/scan-complete", {
      extensions: extensions,
      threats: threats,
      scanTime: new Date().toISOString()
    });

    console.log(`  → Sent ${extensions.length} extensions`);
    console.log(`  → Sent ${threats.length} threats\n`);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 2: Send individual threat (real-time)
    console.log("Test 2: Sending individual threat (real-time)...");
    const newThreat = {
      id: `threat-${Date.now()}-realtime`,
      type: "Suspicious Activity Detected",
      severity: "high",
      extensionId: "ext-999",
      extensionName: "Unknown Extension",
      riskScore: 7,
      patterns: ["Unusual network activity", "Data exfiltration attempt"],
      timestamp: new Date().toISOString(),
      description: "Extension attempted to send user data to external server",
      ai_analysis:
        "Real-time analysis detected suspicious network behavior. The extension is attempting to communicate with an unknown external server.",
      ml_confidence: 0.91
    };

    await sendRequest("/api/threat-detected", newThreat);
    console.log(`  → Sent real-time threat\n`);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 3: Send another scan (simulating periodic scan)
    console.log("Test 3: Sending periodic scan...");

    // Add one more threat
    const newExtensions = [
      ...extensions,
      {
        id: "ext-006",
        name: "Password Stealer",
        version: "1.0.0",
        description: "Collects passwords",
        enabled: true,
        permissions: [
          "tabs",
          "webRequest",
          "webRequestBlocking",
          "storage",
          "cookies"
        ],
        hostPermissions: ["<all_urls>"],
        permissionCount: 6,
        riskScore: 5,
        riskFactors: [
          "Broad URL access",
          "Medium-risk permission: webRequest",
          "Medium-risk permission: webRequestBlocking"
        ]
      }
    ];

    const newThreats = generateSampleThreats(newExtensions);

    await sendRequest("/api/scan-complete", {
      extensions: newExtensions,
      threats: newThreats,
      scanTime: new Date().toISOString()
    });

    console.log(`  → Sent ${newExtensions.length} extensions`);
    console.log(`  → Sent ${newThreats.length} threats\n`);

    console.log("═══════════════════════════════════════════════════");
    console.log("  Test completed successfully! ✓");
    console.log("═══════════════════════════════════════════════════");
    console.log("\nOpen http://localhost:3001 in your browser");
    console.log("to see the dashboard with live data!\n");
  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    console.error("\nMake sure the server is running:");
    console.error("  npm start\n");
  }
}

// Run the test
runTest();
