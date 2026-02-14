"""
Threat intelligence and pattern matching
Complements AI analysis with known threat signatures
"""

import re
from typing import Dict, List

class ThreatIntelligence:
    """Threat intelligence database and pattern matcher"""
    
    # Known malicious patterns
    MALICIOUS_PATTERNS = {
        "data_exfil": {
            "patterns": [
                r"fetch\(['\"]https?://[^'\"]+['\"],\s*{\s*method:\s*['\"]POST['\"]",
                r"XMLHttpRequest.*open\(['\"]POST['\"]",
                r"navigator\.sendBeacon\(",
                r"chrome\.runtime\.sendMessage.*credentials",
            ],
            "severity": "critical",
            "description": "Data exfiltration attempt detected"
        },
        "keylogger": {
            "patterns": [
                r"addEventListener\(['\"]key(down|press|up)['\"]",
                r"document\.onkey(down|press|up)\s*=",
            ],
            "severity": "high",
            "description": "Potential keylogger detected"
        },
        "crypto_miner": {
            "patterns": [
                r"CoinHive|coinhive",
                r"cryptonight|monero",
                r"WebSocket.*wss://.*pool\.",
                r"miner\.start\(",
            ],
            "severity": "critical",
            "description": "Cryptocurrency mining detected"
        },
        "obfuscation": {
            "patterns": [
                r"eval\(atob\(",
                r"Function\(.*atob\(",
                r"\\x[0-9a-f]{2}.*\\x[0-9a-f]{2}",  # Hex encoding
                r"\['\w+'\]\['\w+'\]\['\w+'\]",     # Bracket notation obfuscation
            ],
            "severity": "high",
            "description": "Code obfuscation detected"
        },
        "credential_theft": {
            "patterns": [
                r"chrome\.cookies\.getAll",
                r"chrome\.cookies\.get.*password",
                r"localStorage\.getItem.*token",
                r"sessionStorage\.getItem.*auth",
                r"document\.cookie.*match.*session",
            ],
            "severity": "critical",
            "description": "Credential theft attempt detected"
        },
        "c2_communication": {
            "patterns": [
                r"WebSocket\(['\"]wss?://(?!localhost)[^'\"]+['\"]",
                r"setInterval.*fetch.*command",
                r"chrome\.runtime\.onMessage.*execute",
            ],
            "severity": "critical",
            "description": "Command & control communication detected"
        }
    }
    
    MALICIOUS_DOMAINS = {
        "malicious-tracking.com",
        "evil-analytics.net",
        "crypto-miner.xyz",
    }
    
    SUSPICIOUS_COMBINATIONS = [
        {"apis": ["chrome.cookies", "fetch"], "risk": "credential_theft"},
        {"apis": ["chrome.tabs", "chrome.webRequest", "fetch"], "risk": "man_in_middle"},
        {"apis": ["chrome.debugger", "chrome.tabs"], "risk": "remote_debugging"},
    ]
    
    @classmethod
    def scan_code(cls, code: str) -> Dict:
        """Scan code for known malicious patterns"""
        if not code:
            return {"threats": [], "risk_score": 0.0, "threat_count": 0}

        detected_threats = []
        risk_score = 0.0
        
        severity_scores = {
            "critical": 25,
            "high": 15,
            "medium": 8,
            "low": 3
        }

        for threat_type, config in cls.MALICIOUS_PATTERNS.items():
            for pattern in config["patterns"]:
                if re.search(pattern, code, re.IGNORECASE):
                    detected_threats.append({
                        "type": threat_type,
                        "severity": config["severity"],
                        "description": config["description"]
                    })
                    risk_score += severity_scores.get(config["severity"], 5)
        
        return {
            "threats": detected_threats,
            "risk_score": min(risk_score, 100.0),
            "threat_count": len(detected_threats)
        }

    @classmethod
    def check_domain(cls, domain: str) -> bool:
        return domain.lower() in cls.MALICIOUS_DOMAINS

    @classmethod
    def analyze_permissions(cls, permissions: List[str]) -> Dict:
        risk_flags = []
        risk_score = 0.0
        perm_set = set(permissions)
        
        dangerous_perms = {
            "webRequest": 15, "webRequestBlocking": 20, "cookies": 15,
            "debugger": 25, "<all_urls>": 20, "tabs": 10, "history": 8
        }
        
        for perm, score in dangerous_perms.items():
            if perm in perm_set:
                risk_score += score
                risk_flags.append(f"Dangerous permission: {perm}")
        
        for combo in cls.SUSPICIOUS_COMBINATIONS:
            if all(api in perm_set for api in combo["apis"]):
                risk_score += 25
                risk_flags.append(f"Suspicious combination: {combo['risk']}")
        
        return {
            "risk_score": min(risk_score, 100.0),
            "flags": risk_flags
        }