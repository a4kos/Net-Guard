"""
Isolation Forest for threat pattern detection.
Identifies threats by isolating anomalous behaviors that differ from normal patterns.
"""

from pyexpat import model 
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import numpy as np
import joblib
import os

class ThreatIsolationForest:
    def __init__(self, contamination=0.1, n_estimators=100, random_state=42):
        """
        Initialize Isolation Forest model
        contamination: expected proportion of threats in data (0-1)
        """
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.model = model
        self.scaler = StandardScaler()
        
    def build_model(self):
        """Create Isolation Forest model"""
        self.model = IsolationForest(
            contamination=self.contamination,
            n_estimators=self.n_estimators,
            random_state=self.random_state,
            n_jobs=-1
        )
        
        def train(self, threat_behaviors):
            """
            Train Isolation Forest on threat behavior patterns.
            Model learns to isolate anomalous behaviors.
            """
            if self.model is None:
                self.build_model()
            
            # Normalize data
            X_train = self.scaler.fit_transform(threat_behaviors)
            
            # Train model
            self.model.fit(X_train)
            
            return self
    
        def predict_threat(self, behavior_data):
            """
            Predict if behavior is a threat using Isolation Forest.
            Returns: threat_score (0-1), is_threat (bool), anomaly_score
            """
            if self.model is None or self.scaler is None:
                return None
            
            # Normalize and reshape
            X = self.scaler.transform([behavior_data])
            
            # Get prediction (-1 for outliers/threats, 1 for normal)
            prediction = self.model.predict(X)[0]
            
            # Get anomaly score (negative values = more anomalous)
            anomaly_score = self.model.score_samples(X)[0]
            
            # Convert to 0-1 threat score
            # Normalize anomaly score to 0-1 range (more negative = higher threat)
            threat_score = 1 / (1 + np.exp(anomaly_score))  # Sigmoid normalization
            
            return {
                'is_threat': bool(prediction == -1),
                'threat_score': float(threat_score),
                'anomaly_score': float(anomaly_score),
                'prediction': int(prediction)
            }
        
    def get_feature_importance(self):
        """Get feature importance for threat detection"""
        if self.model is None:
            return None
        
        # Isolation Forest doesn't have built-in feature importance
        # Return placeholder for compatibility
        return {
            'method': 'isolation_forest',
            'note': 'Feature importance calculated through anomaly isolation paths'
        }
    
    def save(self, model_path):
        """Save trained model and scaler"""
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(self.model, f"{model_path}/isolation_forest.pkl")
        joblib.dump(self.scaler, f"{model_path}/scaler_if.pkl")
    
    def load(self, model_path):
        """Load trained model and scaler"""
        self.model = joblib.load(f"{model_path}/isolation_forest.pkl")
        self.scaler = joblib.load(f"{model_path}/scaler_if.pkl")
