# Machine Learning Analysis Engine

## Overview
Deep learning models for comprehensive threat analysis:
- **Autoencoder**: Detects behavioral anomalies
- **Isolation Forest**: Identifies threat patterns

## Components

### 1. Autoencoder (`autoencoder_model.py`)

**Purpose**: Learn "normal" behavior and flag deviations

**Architecture**:
\`\`\`
Input (18 features)
  ↓
Encoder: Dense(64) → Dense(32) → Dense(16) → Dense(8)
  ↓
Bottleneck: 8 dimensions
  ↓
Decoder: Dense(16) → Dense(32) → Dense(64) → Output (18 features)
\`\`\`

**How it works**:
1. Train on normal extension behaviors
2. Model learns to reconstruct normal data accurately
3. When given anomalous behavior, reconstruction error is HIGH
4. High reconstruction error = anomaly detected

**Output**:
\`\`\`python
{
    'anomaly_score': 0.78,  # 0-1, higher = more anomalous
    'reconstruction_error': 2.34,
    'threshold': 1.5,
    'is_anomalous': True
}
\`\`\`

### 2. Isolation Forest (`isolation_forest_model.py`)

**Purpose**: Identify known threat patterns

**Algorithm**:
- Builds isolation trees that separate normal from anomalous data
- Anomalies isolated with fewer splits
- Scales to high-dimensional data

**How it works**:
1. Train on known threat behaviors
2. Model learns what threats look like
3. New behaviors are isolated based on similarity to training threats
4. Anomaly score = depth in isolation tree

**Output**:
\`\`\`python
{
    'is_threat': True,
    'threat_score': 0.85,  # 0-1, higher = more likely threat
    'anomaly_score': -0.42,
    'prediction': -1  # -1 = threat, 1 = normal
}
\`\`\`

### 3. Combined Analyzer (`combined_analyzer.py`)

**Combines both models** for comprehensive assessment:

\`\`\`python
from ml.combined_analyzer import CombinedMLAnalyzer

analyzer = CombinedMLAnalyzer()

# Train on collected data
analyzer.train_models(normal_behaviors, threat_behaviors)

# Analyze new behavior
result = analyzer.analyze_behavior(new_behavior)
print(result)
# Output:
# {
#   'autoencoder': {...},
#   'isolation_forest': {...},
#   'combined_threat_score': 0.81,
#   'recommendation': 'HIGH: Investigate and consider removal'
# }
\`\`\`

## Integration with Flask Backend

\`\`\`python
from ml.combined_analyzer import CombinedMLAnalyzer

class ThreatAnalyzer:
    def __init__(self):
        self.ml_analyzer = CombinedMLAnalyzer()
        self.ml_analyzer.load_models('desktop-app/ml/trained_models')
    
    def analyze_threat(self, threat_data):
        # Extract behavior features
        behavior_vector = self._extract_features(threat_data)
        
        # Get ML analysis
        ml_result = self.ml_analyzer.analyze_behavior(behavior_vector)
        
        # Combine with pattern detection results
        combined_analysis = {
            'pattern_detection': threat_data,
            'ml_analysis': ml_result,
            'final_risk_score': self._combine_scores(threat_data, ml_result)
        }
        
        return combined_analysis
\`\`\`

## Training Data Requirements

### For Autoencoder (Normal Behavior)
- Minimum: 1,000 samples of normal extension behavior
- Optimal: 5,000+ samples
- Features: 18-dimensional behavior vectors

### For Isolation Forest (Threats)
- Minimum: 500 threat samples
- Optimal: 2,000+ threat samples
- Features: Same 18-dimensional vectors

## Performance Characteristics

| Model | Training Time | Inference Time | Memory |
|-------|---|---|---|
| Autoencoder | 2-5 minutes | 50-100ms | ~150MB |
| Isolation Forest | 30-60 seconds | 10-20ms | ~50MB |
| Combined | ~6 minutes | 70-150ms | ~200MB |

## Feature Vector (18 dimensions)

\`\`\`
0. eval
1. dynamic_code_execution
2. function_constructor
3. fetch
4. xmlHttpRequest
5. webSocket
6. localStorage
7. sessionStorage
8. cookies
9. keyboard_events
10. mouse_events
11. clipboard_access
12. dom_manipulation
13. form_hijack
14. obfuscation_score (0-1)
15. code_complexity (0-1)
16. detection_count (normalized)
17. threat_score (0-1)
\`\`\`

## Usage Example

\`\`\`python
# Initialize combined analyzer
analyzer = CombinedMLAnalyzer()

# Load pre-trained models
analyzer.load_models('models/')

# Analyze a threat
threat_behavior = [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0.85, 0.9, 0.5, 0.8]
result = analyzer.analyze_behavior(threat_behavior)

print(f"Combined Threat Score: {result['combined_threat_score']}")
print(f"Recommendation: {result['recommendation']}")
\`\`\`

## Models Directory Structure

\`\`\`
desktop-app/ml/
├── trained_models/
│   ├── autoencoder/
│   │   ├── autoencoder.h5
│   │   ├── scaler.pkl
│   │   └── threshold.pkl
│   └── isolation_forest/
│       ├── isolation_forest.pkl
│       └── scaler_if.pkl
