import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class MLEnsemblePredictor:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        self.is_trained = False
        self.performance_metrics = {}
        
        # Initialize ensemble models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize ensemble models with optimized parameters"""
        
        self.models = {
            'random_forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'gradient_boosting': GradientBoostingRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42
            ),
            'svm': SVR(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                epsilon=0.1
            ),
            'ensemble': None  # Will be created after training individual models
        }
        
        self.scalers = {
            'standard': StandardScaler(),
            'robust': RobustScaler()
        }
    
    def prepare_advanced_features(self, ohlcv_data: pd.DataFrame) -> pd.DataFrame:
        """Create comprehensive feature set for ML models"""
        
        df = ohlcv_data.copy()
        
        # Basic price features
        df['returns'] = df['close'].pct_change()
        df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
        df['high_low_ratio'] = (df['high'] - df['low']) / df['close']
        df['open_close_ratio'] = (df['close'] - df['open']) / df['open']
        
        # Volume features
        df['volume_sma'] = df['volume'].rolling(20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma']
        df['price_volume'] = df['close'] * df['volume']
        df['vwap'] = (df['price_volume'].rolling(20).sum() / df['volume'].rolling(20).sum())
        df['vwap_deviation'] = (df['close'] - df['vwap']) / df['vwap']
        
        # Technical indicators
        df['sma_5'] = df['close'].rolling(5).mean()
        df['sma_20'] = df['close'].rolling(20).mean()
        df['sma_50'] = df['close'].rolling(50).mean()
        df['ema_12'] = df['close'].ewm(span=12).mean()
        df['ema_26'] = df['close'].ewm(span=26).mean()
        
        # RSI
        df['rsi'] = self._calculate_rsi(df['close'])
        df['rsi_oversold'] = (df['rsi'] < 30).astype(int)
        df['rsi_overbought'] = (df['rsi'] > 70).astype(int)
        
        # MACD
        df['macd'] = df['ema_12'] - df['ema_26']
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_histogram'] = df['macd'] - df['macd_signal']
        
        # Bollinger Bands
        df['bb_middle'] = df['close'].rolling(20).mean()
        bb_std = df['close'].rolling(20).std()
        df['bb_upper'] = df['bb_middle'] + (bb_std * 2)
        df['bb_lower'] = df['bb_middle'] - (bb_std * 2)
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
        
        # Volatility features
        df['volatility'] = df['returns'].rolling(20).std()
        df['atr'] = self._calculate_atr(df)
        df['volatility_ratio'] = df['volatility'] / df['volatility'].rolling(50).mean()
        
        # Momentum features
        df['momentum_5'] = df['close'] / df['close'].shift(5) - 1
        df['momentum_10'] = df['close'] / df['close'].shift(10) - 1
        df['momentum_20'] = df['close'] / df['close'].shift(20) - 1
        
        # Pattern features
        df['doji'] = self._detect_doji_pattern(df).astype(int)
        df['hammer'] = self._detect_hammer_pattern(df).astype(int)
        df['engulfing'] = self._detect_engulfing_pattern(df).astype(int)
        
        # Market microstructure
        df['body_size'] = abs(df['close'] - df['open']) / df['open']
        df['upper_shadow'] = (df['high'] - np.maximum(df['open'], df['close'])) / df['open']
        df['lower_shadow'] = (np.minimum(df['open'], df['close']) - df['low']) / df['open']
        
        # Time features
        df['hour'] = pd.to_datetime(df.index).hour if hasattr(df.index, 'hour') else 0
        df['day_of_week'] = pd.to_datetime(df.index).dayofweek if hasattr(df.index, 'dayofweek') else 0
        
        # Lag features
        for lag in [1, 2, 3, 5]:
            df[f'returns_lag_{lag}'] = df['returns'].shift(lag)
            df[f'volume_ratio_lag_{lag}'] = df['volume_ratio'].shift(lag)
            df[f'rsi_lag_{lag}'] = df['rsi'].shift(lag)
        
        # Feature engineering - ratios
        df['sma_ratio_5_20'] = df['sma_5'] / df['sma_20']
        df['sma_ratio_20_50'] = df['sma_20'] / df['sma_50']
        df['ema_ratio'] = df['ema_12'] / df['ema_26']
        
        return df
    
    def create_target_variable(self, df: pd.DataFrame, prediction_horizon: int = 1) -> pd.Series:
        """Create target variable for ML models"""
        
        # Multi-class target: 0=SELL, 1=HOLD, 2=BUY
        future_returns = df['close'].shift(-prediction_horizon) / df['close'] - 1
        
        # Define thresholds
        buy_threshold = 0.02   # 2% gain
        sell_threshold = -0.02 # 2% loss
        
        target = pd.Series(1, index=df.index)  # Default: HOLD
        target[future_returns > buy_threshold] = 2   # BUY
        target[future_returns < sell_threshold] = 0  # SELL
        
        return target
    
    def train_ensemble(self, ohlcv_data: pd.DataFrame, validation_split: float = 0.2) -> Dict:
        """Train ensemble models with cross-validation"""
        
        # Prepare features and target
        feature_df = self.prepare_advanced_features(ohlcv_data)
        target = self.create_target_variable(feature_df)
        
        # Select feature columns
        feature_columns = [col for col in feature_df.columns if not col in ['open', 'high', 'low', 'close', 'volume']]
        X = feature_df[feature_columns].fillna(method='ffill').fillna(0)
        y = target.fillna(1).astype(int)  # Default to HOLD
        
        # Remove rows with NaN in target
        valid_idx = ~(y.isna() | X.isna().any(axis=1))
        X = X[valid_idx]
        y = y[valid_idx]
        
        if len(X) < 100:
            return {'error': 'Insufficient data for training'}
        
        # Split data (time series aware)
        split_idx = int(len(X) * (1 - validation_split))
        X_train, X_val = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_val = y.iloc[:split_idx], y.iloc[split_idx:]
        
        # Scale features
        X_train_scaled = self.scalers['robust'].fit_transform(X_train)
        X_val_scaled = self.scalers['robust'].transform(X_val)
        
        # Train individual models
        model_predictions = {}
        
        for name, model in self.models.items():
            if name == 'ensemble':
                continue
                
            try:
                # Train model
                if name == 'svm':
                    model.fit(X_train_scaled, y_train)
                    train_pred = model.predict(X_train_scaled)
                    val_pred = model.predict(X_val_scaled)
                else:
                    model.fit(X_train, y_train)
                    train_pred = model.predict(X_train)
                    val_pred = model.predict(X_val)
                
                # Convert regression predictions to classification
                train_pred_class = self._convert_to_classes(train_pred)
                val_pred_class = self._convert_to_classes(val_pred)
                
                model_predictions[name] = {
                    'train': train_pred_class,
                    'val': val_pred_class,
                    'model': model
                }
                
                # Calculate metrics
                train_acc = accuracy_score(y_train, train_pred_class)
                val_acc = accuracy_score(y_val, val_pred_class)
                
                self.performance_metrics[name] = {
                    'train_accuracy': train_acc,
                    'val_accuracy': val_acc,
                    'train_f1': f1_score(y_train, train_pred_class, average='weighted'),
                    'val_f1': f1_score(y_val, val_pred_class, average='weighted')
                }
                
                # Feature importance (for tree-based models)
                if hasattr(model, 'feature_importances_'):
                    self.feature_importance[name] = dict(zip(
                        feature_columns, model.feature_importances_
                    ))
                
            except Exception as e:
                print(f"Error training {name}: {e}")
                continue
        
        # Create ensemble model (voting)
        if len(model_predictions) >= 2:
            ensemble_train_pred = self._ensemble_predict(model_predictions, 'train')
            ensemble_val_pred = self._ensemble_predict(model_predictions, 'val')
            
            self.performance_metrics['ensemble'] = {
                'train_accuracy': accuracy_score(y_train, ensemble_train_pred),
                'val_accuracy': accuracy_score(y_val, ensemble_val_pred),
                'train_f1': f1_score(y_train, ensemble_train_pred, average='weighted'),
                'val_f1': f1_score(y_val, ensemble_val_pred, average='weighted')
            }
        
        self.is_trained = True
        
        return {
            'success': True,
            'feature_count': len(feature_columns),
            'training_samples': len(X_train),
            'validation_samples': len(X_val),
            'models_trained': list(model_predictions.keys()),
            'performance_metrics': self.performance_metrics,
            'feature_importance': self.feature_importance
        }
    
    def predict_ensemble(self, ohlcv_data: pd.DataFrame) -> Dict:
        """Generate ensemble predictions"""
        
        if not self.is_trained:
            return {
                'score': 0.5,
                'prediction': 'HOLD',
                'confidence': 0.0,
                'error': 'Models not trained'
            }
        
        try:
            # Prepare features
            feature_df = self.prepare_advanced_features(ohlcv_data)
            feature_columns = [col for col in feature_df.columns if not col in ['open', 'high', 'low', 'close', 'volume']]
            X = feature_df[feature_columns].fillna(method='ffill').fillna(0).iloc[-1:] # Last row only
            
            # Scale features
            X_scaled = self.scalers['robust'].transform(X)
            
            # Get predictions from each model
            predictions = {}
            
            for name, model in self.models.items():
                if name == 'ensemble' or name not in self.performance_metrics:
                    continue
                
                try:
                    if name == 'svm':
                        pred = model.predict(X_scaled)[0]
                    else:
                        pred = model.predict(X)[0]
                    
                    predictions[name] = self._convert_to_classes([pred])[0]
                except:
                    continue
            
            if not predictions:
                return {
                    'score': 0.5,
                    'prediction': 'HOLD',
                    'confidence': 0.0
                }
            
            # Weighted ensemble prediction
            weighted_pred = self._weighted_ensemble_predict(predictions)
            
            # Convert to trading signal
            if weighted_pred == 2:
                prediction = 'BUY'
                score = 0.75
            elif weighted_pred == 0:
                prediction = 'SELL'
                score = 0.25
            else:
                prediction = 'HOLD'
                score = 0.5
            
            # Calculate confidence based on model agreement
            confidence = self._calculate_prediction_confidence(predictions)
            
            return {
                'score': score,
                'prediction': prediction,
                'confidence': confidence,
                'individual_predictions': predictions,
                'model_performance': self.performance_metrics
            }
            
        except Exception as e:
            return {
                'score': 0.5,
                'prediction': 'HOLD',
                'confidence': 0.0,
                'error': str(e)
            }
    
    # Helper methods
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    def _calculate_atr(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        high_low = df['high'] - df['low']
        high_close = (df['high'] - df['close'].shift()).abs()
        low_close = (df['low'] - df['close'].shift()).abs()
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return tr.rolling(period).mean()
    
    def _detect_doji_pattern(self, df: pd.DataFrame) -> pd.Series:
        body_size = abs(df['close'] - df['open'])
        total_range = df['high'] - df['low']
        return (body_size / total_range < 0.1) & (total_range > 0)
    
    def _detect_hammer_pattern(self, df: pd.DataFrame) -> pd.Series:
        body_size = abs(df['close'] - df['open'])
        lower_shadow = np.minimum(df['open'], df['close']) - df['low']
        upper_shadow = df['high'] - np.maximum(df['open'], df['close'])
        return (lower_shadow > 2 * body_size) & (upper_shadow < body_size)
    
    def _detect_engulfing_pattern(self, df: pd.DataFrame) -> pd.Series:
        # Simplified engulfing detection
        curr_body = abs(df['close'] - df['open'])
        prev_body = abs(df['close'].shift(1) - df['open'].shift(1))
        return curr_body > prev_body * 1.5
    
    def _convert_to_classes(self, predictions: np.ndarray) -> np.ndarray:
        """Convert regression predictions to classes"""
        result = np.ones_like(predictions, dtype=int)  # Default: HOLD
        result[predictions > 0.6] = 2  # BUY
        result[predictions < 0.4] = 0  # SELL
        return result
    
    def _ensemble_predict(self, predictions: Dict, split: str) -> np.ndarray:
        """Simple majority voting ensemble"""
        pred_arrays = [pred[split] for pred in predictions.values()]
        pred_matrix = np.column_stack(pred_arrays)
        
        # Majority vote
        ensemble_pred = []
        for row in pred_matrix:
            values, counts = np.unique(row, return_counts=True)
            ensemble_pred.append(values[np.argmax(counts)])
        
        return np.array(ensemble_pred)
    
    def _weighted_ensemble_predict(self, predictions: Dict) -> int:
        """Weighted ensemble prediction based on model performance"""
        if not predictions:
            return 1  # HOLD
        
        weights = {}
        for name in predictions.keys():
            if name in self.performance_metrics:
                weights[name] = self.performance_metrics[name]['val_accuracy']
            else:
                weights[name] = 0.5
        
        # Weighted vote
        weighted_sum = {0: 0, 1: 0, 2: 0}
        total_weight = 0
        
        for name, pred in predictions.items():
            weight = weights.get(name, 0.5)
            weighted_sum[pred] += weight
            total_weight += weight
        
        if total_weight == 0:
            return 1
        
        # Normalize and find max
        for key in weighted_sum:
            weighted_sum[key] /= total_weight
        
        return max(weighted_sum, key=weighted_sum.get)
    
    def _calculate_prediction_confidence(self, predictions: Dict) -> float:
        """Calculate confidence based on model agreement"""
        if len(predictions) <= 1:
            return 0.5
        
        pred_values = list(predictions.values())
        unique_preds, counts = np.unique(pred_values, return_counts=True)
        
        # Confidence is the proportion of models agreeing
        max_agreement = np.max(counts) / len(pred_values)
        return max_agreement

# Global ensemble predictor instance
ml_ensemble_predictor = MLEnsemblePredictor()