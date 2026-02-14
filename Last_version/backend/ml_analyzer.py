import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pickle
import os

class MLThreatAnalyzer:
    def __init__(self):
        self.scaler = StandardScaler()
        # contamination=0.1 means we expect 10% of extensions to be 'weird'
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.model_path = 'models/threat_model.pkl'
        self.load_or_train()
    
    def extract_features(self, threat):
        """
        Converts a JSON threat object into a numerical vector the ML can understand.
        We look at 12 distinct behaviors (features).
        """
        severity_map = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        code = threat.get('code', '')
        
        # This creates a "fingerprint" of the extension's behavior
        return [
            threat.get('score', 0),                                # Permission score
            severity_map.get(threat.get('severity', 'low'), 1),    # Severity weight
            len(threat.get('patterns', [])),                       # Number of matches
            len(code),                                             # Length of code (obfuscation hint)
            1 if 'eval' in threat.get('type', '') else 0,          # Code execution
            1 if 'fetch' in threat.get('type', '') else 0,         # Data exfiltration
            1 if 'cookie' in code.lower() else 0,                  # Identity theft risk
            1 if 'localStorage' in code else 0,                    # Data scraping
            1 if 'atob' in code else 0,                            # Base64 decoding (obfuscation)
            code.count('('),                                       # Function call density
            code.count('.'),                                       # Property access density
            len(set(code)) / max(len(code), 1)                     # Entropy (randomness)
        ]
    
    def load_or_train(self):
        """Ensures the model is ready for use."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    data = pickle.load(f)
                    self.scaler = data['scaler']
                    self.isolation_forest = data['model']
                print("ML Model loaded successfully.")
            except Exception as e:
                print(f"Error loading model: {e}. Retraining...")
                self.train_on_synthetic()
        else:
            self.train_on_synthetic()
    
    def train_on_synthetic(self):
        """Generates baseline data so the model knows what 'normal' looks like."""
        print("Training new ML model on synthetic baseline...")
        # Normal behaviors: Low permissions, short code, few patterns
        normal = np.random.normal([10, 1, 2, 100, 0, 0, 0, 0, 0, 5, 3, 0.3], 
                                   [5, 0.5, 1, 50, 0.1, 0.1, 0.1, 0.1, 0.1, 2, 1, 0.1], 
                                   (800, 12))
        
        # Malicious behaviors: High permissions, long/complex code, heavy patterns
        malicious = np.random.normal([40, 3.5, 5, 300, 0.8, 0.7, 0.6, 0.5, 0.7, 15, 8, 0.6],
                                      [10, 0.5, 2, 100, 0.2, 0.2, 0.2, 0.2, 0.2, 5, 2, 0.15],
                                      (200, 12))
        
        data = np.vstack([normal, malicious])
        self.train(data)

    def train(self, data):
        """Saves the trained model to disk."""
        scaled = self.scaler.fit_transform(data)
        self.isolation_forest.fit(scaled)
        
        os.makedirs('models', exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump({'scaler': self.scaler, 'model': self.isolation_forest}, f)
        print(f"Model saved to {self.model_path}")
    
    def analyze(self, threat):
        """The main entry point: takes a threat and returns a decision."""
        features = np.array([self.extract_features(threat)])
        scaled = self.scaler.transform(features)
        
        # decision_function gives a raw score: lower means more anomalous
        raw_score = self.isolation_forest.decision_function(scaled)[0]
        prediction = self.isolation_forest.predict(scaled)[0]
        
        # Convert raw score to 0-1 confidence. 
        # Since lower raw_score = anomaly, we invert it.
        confidence = 1 / (1 + np.exp(raw_score * 5)) 
        
        return {
            'is_threat': bool(prediction == -1),
            'confidence': round(float(confidence), 4),
            'risk_level': 'critical' if confidence > 0.8 else 'high' if confidence > 0.6 else 'medium' if confidence > 0.3 else 'low'
        }

# Singleton instance for app.py
_analyzer = None

def get_analyzer():
    global _analyzer
    if _analyzer is None:
        _analyzer = MLThreatAnalyzer()
    return _analyzer