// Advanced pattern detection for suspicious code
export const THREAT_PATTERNS = {
  // Code execution threats
  EVAL: {
    pattern: /eval\s*\(/gi,
    severity: "critical",
    category: "code-execution",
    description: "Dynamic code execution via eval()"
  },
  FUNCTION_CONSTRUCTOR: {
    pattern: /new\s+Function\s*\(/gi,
    severity: "critical",
    category: "code-execution",
    description: "Dynamic function creation"
  },
  DYNAMIC_IMPORT: {
    pattern: /import\s*\(\s*[`'"]/gi,
    severity: "high",
    category: "code-execution",
    description: "Dynamic module import"
  },

  // Obfuscation indicators
  UNICODE_ESCAPE: {
    pattern: /\\u[0-9a-f]{4}/gi,
    severity: "medium",
    category: "obfuscation",
    description: "Unicode escape sequences (possible obfuscation)"
  },
  HEX_ENCODING: {
    pattern: /\\x[0-9a-f]{2}/gi,
    severity: "medium",
    category: "obfuscation",
    description: "Hex encoding (possible obfuscation)"
  },
  BASE64_DECODE: {
    pattern: /atob\s*\(/gi,
    severity: "high",
    category: "obfuscation",
    description: "Base64 decoding (possible payload)"
  },
  CHAR_CODE_AT: {
    pattern: /charCodeAt|fromCharCode/gi,
    severity: "medium",
    category: "obfuscation",
    description: "Character code manipulation"
  },

  // Data exfiltration
  FETCH_API: {
    pattern: /fetch\s*\(/gi,
    severity: "medium",
    category: "network",
    description: "Network request via fetch()"
  },
  XML_HTTP_REQUEST: {
    pattern: /new\s+XMLHttpRequest/gi,
    severity: "medium",
    category: "network",
    description: "Network request via XMLHttpRequest"
  },
  WEB_SOCKET: {
    pattern: /new\s+WebSocket/gi,
    severity: "high",
    category: "network",
    description: "WebSocket connection"
  },
  SEND_BEACON: {
    pattern: /navigator\.sendBeacon/gi,
    severity: "high",
    category: "network",
    description: "Data transmission via sendBeacon"
  },

  // Sensitive data access
  COOKIE_ACCESS: {
    pattern: /document\.cookie/gi,
    severity: "high",
    category: "data-access",
    description: "Cookie access"
  },
  LOCAL_STORAGE: {
    pattern: /localStorage\.(getItem|setItem|removeItem)/gi,
    severity: "medium",
    category: "data-access",
    description: "LocalStorage access"
  },
  SESSION_STORAGE: {
    pattern: /sessionStorage\.(getItem|setItem|removeItem)/gi,
    severity: "medium",
    category: "data-access",
    description: "SessionStorage access"
  },
  INDEXED_DB: {
    pattern: /indexedDB\.open/gi,
    severity: "medium",
    category: "data-access",
    description: "IndexedDB access"
  },

  // DOM manipulation threats
  INNER_HTML: {
    pattern: /innerHTML\s*=/gi,
    severity: "medium",
    category: "dom-manipulation",
    description: "innerHTML manipulation (XSS risk)"
  },
  OUTER_HTML: {
    pattern: /outerHTML\s*=/gi,
    severity: "medium",
    category: "dom-manipulation",
    description: "outerHTML manipulation (XSS risk)"
  },
  DOCUMENT_WRITE: {
    pattern: /document\.write/gi,
    severity: "high",
    category: "dom-manipulation",
    description: "document.write (XSS risk)"
  },
  INSERT_ADJACENT_HTML: {
    pattern: /insertAdjacentHTML/gi,
    severity: "medium",
    category: "dom-manipulation",
    description: "insertAdjacentHTML (XSS risk)"
  },

  // Crypto mining indicators
  WEB_ASSEMBLY: {
    pattern: /WebAssembly\.(instantiate|compile)/gi,
    severity: "high",
    category: "crypto-mining",
    description: "WebAssembly usage (possible crypto miner)"
  },
  WEB_WORKER: {
    pattern: /new\s+Worker\s*\(/gi,
    severity: "medium",
    category: "crypto-mining",
    description: "Web Worker creation"
  },
  SHARED_ARRAY_BUFFER: {
    pattern: /SharedArrayBuffer/gi,
    severity: "medium",
    category: "crypto-mining",
    description: "SharedArrayBuffer usage"
  },

  // Keylogging indicators
  KEY_EVENT_LISTENER: {
    pattern: /addEventListener\s*\(\s*['"]key(down|up|press)['"]/gi,
    severity: "high",
    category: "keylogging",
    description: "Keyboard event listener"
  },
  INPUT_EVENT_LISTENER: {
    pattern: /addEventListener\s*\(\s*['"]input['"]/gi,
    severity: "medium",
    category: "keylogging",
    description: "Input event listener"
  },

  // Clipboard access
  CLIPBOARD_READ: {
    pattern: /navigator\.clipboard\.read/gi,
    severity: "high",
    category: "clipboard",
    description: "Clipboard read access"
  },
  CLIPBOARD_WRITE: {
    pattern: /navigator\.clipboard\.write/gi,
    severity: "medium",
    category: "clipboard",
    description: "Clipboard write access"
  },

  // Geolocation
  GEOLOCATION: {
    pattern: /navigator\.geolocation/gi,
    severity: "medium",
    category: "privacy",
    description: "Geolocation access"
  },

  // Camera/Microphone
  GET_USER_MEDIA: {
    pattern: /getUserMedia/gi,
    severity: "critical",
    category: "privacy",
    description: "Camera/microphone access"
  },

  // Dangerous URLs
  DATA_URI: {
    pattern: /data:text\/(html|javascript)/gi,
    severity: "high",
    category: "injection",
    description: "Data URI (possible code injection)"
  },
  JAVASCRIPT_PROTOCOL: {
    pattern: /javascript:/gi,
    severity: "high",
    category: "injection",
    description: "JavaScript protocol (XSS risk)"
  },
  BLOB_URL: {
    pattern: /createObjectURL/gi,
    severity: "medium",
    category: "injection",
    description: "Blob URL creation"
  },

  // Chrome API abuse
  CHROME_TABS_EXECUTE: {
    pattern: /chrome\.tabs\.executeScript/gi,
    severity: "critical",
    category: "api-abuse",
    description: "Script injection into tabs"
  },
  CHROME_COOKIES: {
    pattern: /chrome\.cookies/gi,
    severity: "high",
    category: "api-abuse",
    description: "Chrome cookies API access"
  },
  CHROME_WEB_REQUEST: {
    pattern: /chrome\.webRequest/gi,
    severity: "high",
    category: "api-abuse",
    description: "Web request interception"
  },
  CHROME_DEBUGGER: {
    pattern: /chrome\.debugger/gi,
    severity: "critical",
    category: "api-abuse",
    description: "Chrome debugger API usage"
  }
};

// Calculate threat score based on detected patterns
export function calculateThreatScore(detections) {
  const severityScores = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 2
  };

  let totalScore = 0;
  const categoryCount = new Map();

  for (const detection of detections) {
    totalScore += severityScores[detection.severity] || 0;

    // Increase score for multiple detections in same category
    const count = categoryCount.get(detection.category) || 0;
    categoryCount.set(detection.category, count + 1);

    if (count > 2) {
      totalScore += 5; // Bonus for repeated suspicious patterns
    }
  }

  return Math.min(totalScore, 100);
}

// Analyze code for suspicious patterns
export function analyzeCode(code) {
  const detections = [];

  for (const [name, threat] of Object.entries(THREAT_PATTERNS)) {
    // Reset lastIndex to avoid stale state from prior calls (regex objects with
    // the 'g' flag persist their lastIndex between uses since they are constants)
    threat.pattern.lastIndex = 0;
    const matches = code.match(threat.pattern);
    if (matches) {
      detections.push({
        name,
        ...threat,
        matchCount: matches.length,
        samples: matches.slice(0, 3) // First 3 matches
      });
    }
  }

  const threatScore = calculateThreatScore(detections);
  const riskLevel = getRiskLevel(threatScore);

  return {
    detections,
    threatScore,
    riskLevel,
    timestamp: Date.now()
  };
}

// Get risk level based on threat score
function getRiskLevel(score) {
  if (score >= 50) return "critical";
  if (score >= 30) return "high";
  if (score >= 15) return "medium";
  return "low";
}

// Check for obfuscation indicators
export function detectObfuscation(code) {
  const indicators = [];

  // High entropy (random-looking strings)
  const entropy = calculateEntropy(code);
  if (entropy > 4.5) {
    indicators.push({ type: "high-entropy", value: entropy });
  }

  // Excessive string concatenation
  const concatCount = (code.match(/\+\s*['"]/g) || []).length;
  if (concatCount > 20) {
    indicators.push({ type: "string-concatenation", count: concatCount });
  }

  // Unusual variable names
  const shortVarPattern = /\b[a-z_$]{1,2}\b/g;
  const shortVars = (code.match(shortVarPattern) || []).length;
  if (shortVars > 50) {
    indicators.push({ type: "short-variable-names", count: shortVars });
  }

  return indicators;
}

// Calculate Shannon entropy
function calculateEntropy(str) {
  const len = str.length;
  const frequencies = {};

  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}
