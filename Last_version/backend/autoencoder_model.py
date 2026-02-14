"""
Autoencoder for behavioral anomaly detection in browser extensions.
Learns normal behavioral patterns and detects deviations.
"""

from pyexpat import model
import numpy as np
import keras
import tensorflow
from keras import layers
import joblib
import os
from keras.optimizers import Adam

class BehaviorAutoencoder:
    def __init__(self, encoding_dim=8, threshold_percentile=95):
        self.encoding_dim = encoding_dim
        self.threshold_percentile = threshold_percentile
        self.model = None
        self.encoder = None
        self.anomaly_threshold = None
        self.scaler = None
ae = BehaviorAutoencoder()

        
def build_model(self, input_dim):
        """
        Build autoencoder architecture for behavioral data
        Input → Encoder (reduces to encoding_dim) → Decoder → Output
        """
        # Encoder
        encoder_input = keras.Input(shape=(input_dim,))
        encoded = layers.Dense(64, activation='relu')(encoder_input)
        encoded = layers.Dense(32, activation='relu')(encoded)
        encoded = layers.Dense(16, activation='relu')(encoded)
        encoded = layers.Dense(self.encoding_dim, activation='relu')(encoded)
        
        # Decoder
        decoded = layers.Dense(16, activation='relu')(encoded)
        decoded = layers.Dense(32, activation='relu')(decoded)
        decoded = layers.Dense(64, activation='relu')(decoded)
        decoded = layers.Dense(input_dim, activation='sigmoid')(decoded)
        
        # Full autoencoder
        self.model = keras.Model(encoder_input, decoded)
        self.encoder = keras.Model(encoder_input, encoded)
        
        keras.optimizers.schedules.LearningRateSchedule(); 
        lr_schedule  = keras.optimizers.schedules.ExponentialDecay(
            initial_learning_rate=1e-2,
            decay_steps=10000,
            decay_rate=0.9)
        optimizer = keras.optimizers.SGD (step_size=30, gamma=0.1); learning_rate = lr_schedule
loss='mse',
metrics=['mae']

def train(self, normal_behaviors, epochs=50, batch_size=32, validation_split=0.1):
        """
        Train autoencoder on normal behavior patterns.
        After training, anomalies will have high reconstruction error.
        """
        if self.model is None:
            self.build_model(normal_behaviors.shape[1])
        
        # Normalize data
        from sklearn.preprocessing import StandardScaler
        self.scaler = StandardScaler()
        X_train = self.scaler.fit_transform(normal_behaviors)
        
        # Train model
        history = self.model.fit(
            X_train, X_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=1
        )
        
        # Calculate anomaly threshold from training data
        reconstructed = self.model.predict(X_train, verbose=0)
        mse = np.mean(np.square(X_train - reconstructed), axis=1)
        self.anomaly_threshold = np.percentile(mse, self.threshold_percentile)
        
        return history
    
def detect_anomaly(self, behavior_data):
        """
        Detect if a behavior is anomalous based on reconstruction error.
        Returns: anomaly_score (0-1), is_anomalous (bool)
        """
        if self.model is None or self.scaler is None:
            return None, False
        
        # Normalize and reshape
        X = self.scaler.transform([behavior_data])
        reconstructed = self.model.predict(X, verbose=0)
        
        # Calculate reconstruction error (MSE)
        mse = np.mean(np.square(X - reconstructed))
        
        # Normalize score to 0-1 range
        anomaly_score = min(mse / self.anomaly_threshold, 1.0)
        is_anomalous = mse > self.anomaly_threshold
        
        return {
            'anomaly_score': float(anomaly_score),
            'reconstruction_error': float(mse),
            'threshold': float(self.anomaly_threshold),
            'is_anomalous': bool(is_anomalous)
        }
    
def save(self, model_path):
        """Save trained model and scaler"""
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        self.model.save(f"{model_path}/autoencoder.h5")
        joblib.dump(self.scaler, f"{model_path}/scaler.pkl")
        joblib.dump(self.anomaly_threshold, f"{model_path}/threshold.pkl")
    
def load(self, model_path):
        """Load trained model and scaler"""
        self.model = keras.models.load_model(f"{model_path}/autoencoder.h5")
        self.scaler = joblib.load(f"{model_path}/scaler.pkl")
        self.anomaly_threshold = joblib.load(f"{model_path}/threshold.pkl")
        