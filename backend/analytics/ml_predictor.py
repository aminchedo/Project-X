import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

class MLPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=10)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = [
            'price_change', 'high_low_ratio', 'volume_ratio',
            'rsi', 'ema_ratio', 'volatility', 'momentum'
        ]
    
    def prepare_features(self, ohlcv_data: pd.DataFrame) -> np.ndarray:
        """Create feature set from OHLCV data"""
        df = ohlcv_data.copy()
        
        # Price features
        df['price_change'] = df['close'].pct_change()
        df['high_low_ratio'] = (df['high'] - df['low']) / df['close']
        df['volume_ratio'] = df['volume'] / df['volume'].rolling(10).mean()
        
        # Technical indicators
        df['rsi'] = self._calculate_simple_rsi(df['close'])
        df['ema_5'] = df['close'].ewm(span=5).mean()
        df['ema_20'] = df['close'].ewm(span=20).mean()
        df['ema_ratio'] = df['ema_5'] / df['ema_20']
        
        # Additional features
        df['volatility'] = df['close'].rolling(10).std() / df['close'].rolling(10).mean()
        df['momentum'] = df['close'] / df['close'].shift(5) - 1
        
        # Select features
        feature_matrix = df[self.feature_names].fillna(0).values
        return feature_matrix
    
    def _calculate_simple_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI for feature engineering"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50)
    
    def train_model(self, ohlcv_data: pd.DataFrame) -> bool:
        """Train the ML model on historical data"""
        if len(ohlcv_data) < 100:
            return False
        
        try:
            features = self.prepare_features(ohlcv_data)
            
            # Create target (future price direction)
            future_returns = ohlcv_data['close'].shift(-1) / ohlcv_data['close'] - 1
            target = (future_returns > 0).astype(int)
            
            # Remove last row (no future data) and NaN values
            features = features[:-1]
            target = target[:-1]
            
            # Remove NaN values
            valid_indices = ~np.isnan(features).any(axis=1) & ~np.isnan(target)
            features = features[valid_indices]
            target = target[valid_indices]
            
            if len(features) < 50:
                return False
            
            # Split data for training
            X_train, X_test, y_train, y_test = train_test_split(
                features, target, test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model.fit(X_train_scaled, y_train)
            
            # Validate model
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)
            
            print(f"ML Model trained - Train Score: {train_score:.3f}, Test Score: {test_score:.3f}")
            
            self.is_trained = True
            return True
            
        except Exception as e:
            print(f"Error training ML model: {e}")
            return False
    
    def predict(self, ohlcv_data: pd.DataFrame) -> dict:
        """Make ML prediction (5% weight in final algorithm)"""
        if not self.is_trained:
            # Quick training on available data
            self.train_model(ohlcv_data)
        
        if not self.is_trained or len(ohlcv_data) < 20:
            return {
                'score': 0.5,
                'prediction': 'NEUTRAL',
                'confidence': 0.0
            }
        
        try:
            # Prepare current features
            features = self.prepare_features(ohlcv_data)
            current_features = features[-1:].reshape(1, -1)
            
            # Handle NaN values
            if np.isnan(current_features).any():
                return {
                    'score': 0.5,
                    'prediction': 'NEUTRAL', 
                    'confidence': 0.0
                }
            
            # Scale and predict
            features_scaled = self.scaler.transform(current_features)
            prediction_proba = self.model.predict_proba(features_scaled)[0]
            
            # Get prediction and confidence
            if len(prediction_proba) > 1:
                bullish_prob = prediction_proba[1]
            else:
                bullish_prob = 0.5
            
            # Determine action
            if bullish_prob > 0.6:
                prediction = 'BUY'
            elif bullish_prob < 0.4:
                prediction = 'SELL'
            else:
                prediction = 'HOLD'
            
            confidence = abs(bullish_prob - 0.5) * 2
            
            return {
                'score': bullish_prob,
                'prediction': prediction,
                'confidence': confidence
            }
            
        except Exception as e:
            print(f"Error making ML prediction: {e}")
            return {
                'score': 0.5,
                'prediction': 'NEUTRAL',
                'confidence': 0.0
            }

# Global ML predictor instance
ml_predictor = MLPredictor()