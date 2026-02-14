"""
Combined ML analyzer using Autoencoder + Isolation Forest
Provides comprehensive threat detection and anomaly analysis
"""

import numpy as np
from .autoencoder_model import BehaviorAutoencoder
from .isolation_forest_model import ThreatIsolationForest

class CombinedMLAnalyzer:
    def __init__(self):
        self.autoencoder = BehaviorAutoencoder(encoding_dim=8, threshold_percentile=95)
        self.isolation_forest = ThreatIsolationForest(contamination=0.15)
        self.feature_names = [
            'eval', 'dynamic_code_exec', 'function_constructor',
            'fetch', 'xhr', 'websocket',
            'localStorage', 'sessionStorage', 'cookies',
            'keyboard_events', 'mouse_events', 'clipboard_access',
            'dom_manipulation', 'form_hijack',
            'obfuscation_score', 'code_complexity',
            'detection_count', 'threat_score'
        ]
    
        def train_models(self, normal_behaviors, threat_behaviors ):
            """
            Train both models on separate data
            normal_behaviors: array of normal behavior feature vectors
            threat_behaviors: array of threat behavior feature vectors
            """
            print("[Combined ML] Training Autoencoder on normal behaviors...")
            self.autoencoder.train(normal_behaviors, epochs=50)
            
            print("[Combined ML] Training Isolation Forest on threat behaviors...")
            self.isolation_forest.train(threat_behaviors)
        
        print("[Combined ML] Models trained successfully")
    
        def analyze_behavior(self, behavior_data):
            """
            Analyze behavior using both models
            Returns comprehensive threat assessment
            """
            # Autoencoder analysis (anomaly detection)
            ae_result = self.autoencoder.detect_anomaly(behavior_data)
            
            # Isolation Forest analysis (threat detection)
            if_result = self.isolation_forest.predict_threat(behavior_data)
        
            # Combine results
            combined_score = self._combine_scores(ae_result, if_result)
            
            return {
                'autoencoder': ae_result,
                'isolation_forest': if_result,
                'combined_threat_score': combined_score,
                'recommendation': self._get_recommendation(combined_score, ae_result, if_result)
        }
    
    def _combine_scores(self, ae_result, if_result):
        """
        Intelligently combine anomaly and threat scores
        Uses weighted average with adjustments
        """
        if ae_result is None or if_result is None:
            return None
        
        # Weight: 40% anomaly detection, 60% threat isolation
        ae_weight = 0.4
        if_weight = 0.6
        
        combined = (ae_result['anomaly_score'] * ae_weight + 
                   if_result['threat_score'] * if_weight)
        
        return min(combined, 1.0)
    
    def _get_recommendation(self, combined_score, ae_result, if_result):
        """Generate recommendation based on combined analysis"""
        if combined_score is None:
            return "Unable to analyze"
        
        if combined_score > 0.8:
            if if_result['is_threat']:
                return "CRITICAL: Remove extension immediately"
            return "HIGH: Investigate and consider removal"
        elif combined_score > 0.6:
            return "MEDIUM: Monitor closely"
        elif combined_score > 0.4:
            return "LOW: Keep under observation"
        else:
            return "NORMAL: Behavior appears safe"
    
def save_models(self, model_dir):
        """Save both trained models"""
        self.autoencoder.save(f"{model_dir}/autoencoder")
        self.isolation_forest.save(f"{model_dir}/isolation_forest")
    
def load_models(self, model_dir):
        """Load pre-trained models"""
        self.autoencoder.load(f"{model_dir}/autoencoder")
        self.isolation_forest.load(f"{model_dir}/isolation_forest")