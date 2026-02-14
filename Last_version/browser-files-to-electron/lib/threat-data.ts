// Types that mirror the extension's pattern-detector categories
export interface ThreatPattern {
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  description: string;
  matchCount: number;
}

export interface FlaggedExtension {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  permissions: string[];
  flagReasons: FlagReason[];
  detectedAt: string;
}

export interface FlagReason {
  category: string;
  label: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface CategoryBreakdown {
  category: string;
  label: string;
  count: number;
  color: string;
}

// The dashboard focuses on WHY things are flagged (the reasoning).
// The extension popup shows simple counts (scanned/threats).
// The desktop app has in-depth ML analysis + AI model.
// So the dashboard's unique value is: permission-risk analysis and flag-reason breakdowns.

// Simulated data representing what the extension would send to the dashboard
export function generateDemoData(): {
  extensions: FlaggedExtension[];
  categories: CategoryBreakdown[];
  summary: {
    totalExtensions: number;
    flaggedExtensions: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
} {
  const extensions: FlaggedExtension[] = [
    {
      id: "ext-001",
      name: "QuickTab Manager",
      version: "2.4.1",
      enabled: true,
      riskScore: 78,
      riskLevel: "critical",
      permissions: ["<all_urls>", "tabs", "webRequest", "debugger"],
      flagReasons: [
        {
          category: "api-abuse",
          label: "Debugger API Access",
          detail:
            "Uses chrome.debugger which can inspect and modify all browser traffic",
          severity: "critical"
        },
        {
          category: "network",
          label: "Web Request Interception",
          detail:
            "Intercepts HTTP requests via webRequest permission, can read/modify headers",
          severity: "high"
        },
        {
          category: "data-access",
          label: "Broad URL Access",
          detail:
            "Has <all_urls> host permission granting access to every website",
          severity: "high"
        }
      ],
      detectedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    {
      id: "ext-002",
      name: "PDF Helper Plus",
      version: "1.0.3",
      enabled: true,
      riskScore: 52,
      riskLevel: "high",
      permissions: ["<all_urls>", "nativeMessaging", "storage"],
      flagReasons: [
        {
          category: "api-abuse",
          label: "Native Messaging",
          detail:
            "Can communicate with native applications outside the browser sandbox",
          severity: "critical"
        },
        {
          category: "data-access",
          label: "Broad URL Access",
          detail:
            "Has <all_urls> host permission granting access to every website",
          severity: "high"
        }
      ],
      detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: "ext-003",
      name: "StyleSnap",
      version: "3.1.0",
      enabled: true,
      riskScore: 38,
      riskLevel: "medium",
      permissions: ["tabs", "tabCapture", "storage"],
      flagReasons: [
        {
          category: "privacy",
          label: "Tab Capture",
          detail:
            "Can capture visible tab content as a media stream (screenshots/recording)",
          severity: "high"
        },
        {
          category: "data-access",
          label: "Tab Access",
          detail: "Can read URL, title, and status of all open tabs",
          severity: "medium"
        }
      ],
      detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: "ext-004",
      name: "ProxySwitch",
      version: "1.7.2",
      enabled: true,
      riskScore: 65,
      riskLevel: "high",
      permissions: ["proxy", "webRequest", "webRequestBlocking", "*://*/*"],
      flagReasons: [
        {
          category: "network",
          label: "Proxy Control",
          detail:
            "Can route all browser traffic through arbitrary proxy servers",
          severity: "critical"
        },
        {
          category: "network",
          label: "Request Blocking",
          detail: "Can block or modify HTTP requests before they are sent",
          severity: "high"
        },
        {
          category: "data-access",
          label: "Broad URL Access",
          detail:
            "Has wildcard host permission granting access to every website",
          severity: "high"
        }
      ],
      detectedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString()
    },
    {
      id: "ext-005",
      name: "DarkReader Clone",
      version: "4.0.1",
      enabled: true,
      riskScore: 22,
      riskLevel: "medium",
      permissions: ["<all_urls>", "storage"],
      flagReasons: [
        {
          category: "data-access",
          label: "Broad URL Access",
          detail:
            "Has <all_urls> host permission granting access to every website",
          severity: "high"
        }
      ],
      detectedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString()
    }
  ];

  const categories: CategoryBreakdown[] = [
    {
      category: "api-abuse",
      label: "API Abuse",
      count: 3,
      color: "hsl(var(--chart-1))"
    },
    {
      category: "network",
      label: "Network Interception",
      count: 3,
      color: "hsl(var(--chart-2))"
    },
    {
      category: "data-access",
      label: "Data Access",
      count: 5,
      color: "hsl(var(--chart-3))"
    },
    {
      category: "privacy",
      label: "Privacy Risk",
      count: 1,
      color: "hsl(var(--chart-5))"
    }
  ];

  return {
    extensions,
    categories,
    summary: {
      totalExtensions: 14,
      flaggedExtensions: extensions.length,
      criticalCount: extensions.filter((e) => e.riskLevel === "critical")
        .length,
      highCount: extensions.filter((e) => e.riskLevel === "high").length,
      mediumCount: extensions.filter((e) => e.riskLevel === "medium").length,
      lowCount: extensions.filter((e) => e.riskLevel === "low").length
    }
  };
}
