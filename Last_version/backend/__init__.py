"""
Machine Learning module for threat detection and analysis
Combines TensorFlow.js (browser) with Autoencoder + Isolation Forest (desktop)
"""

from .combined_analyzer import CombinedMLAnalyzer
from .autoencoder_model import BehaviorAutoencoder
from .isolation_forest_model import ThreatIsolationForest

__all__ = [
    'CombinedMLAnalyzer',
    'BehaviorAutoencoder',
    'ThreatIsolationForest'
]
