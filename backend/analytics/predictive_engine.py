import asyncio
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow import keras
import talib
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class PredictiveEngine:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        self.prediction_cache = {}
        self.strategy_templates = self._load_strategy_templates()
        
    def _load_strategy_templates(self) -> Dict[str, Any]:
        """Load predefined strategy templates for auto-generation"""
        return {
            "momentum": {
                "indicators": ["RSI", "MACD", "BB", "ADX"],
                "timeframes": ["1m", "5m", "15m"],
                "risk_params": {"max_drawdown": 0.05, "position_size": 0.02}
            },
            "mean_reversion": {
                "indicators": ["BB", "RSI", "STOCH", "WILLIAMS"],
                "timeframes": ["5m", "15m", "30m"],
                "risk_params": {"max_drawdown": 0.03, "position_size": 0.015}
            },
            "breakout": {
                "indicators": ["ATR", "VOLUME", "BB", "DONCHIAN"],
                "timeframes": ["15m", "30m", "1h"],
                "risk_params": {"max_drawdown": 0.07, "position_size": 0.025}
            },
            "scalping": {
                "indicators": ["EMA", "VWAP", "ORDERBOOK", "TICK"],
                "timeframes": ["1m", "3m"],
                "risk_params": {"max_drawdown": 0.02, "position_size": 0.01}
            }
        }
    
    async def generate_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate comprehensive technical features for ML models"""
        df = data.copy()
        
        # Price-based features
        df['returns'] = df['close'].pct_change()
        df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
        df['volatility'] = df['returns'].rolling(20).std()
        
        # Technical indicators
        df['rsi'] = talib.RSI(df['close'].values)
        df['macd'], df['macd_signal'], df['macd_hist'] = talib.MACD(df['close'].values)
        df['bb_upper'], df['bb_middle'], df['bb_lower'] = talib.BBANDS(df['close'].values)
        df['atr'] = talib.ATR(df['high'].values, df['low'].values, df['close'].values)
        df['adx'] = talib.ADX(df['high'].values, df['low'].values, df['close'].values)
        
        # Volume indicators
        df['volume_sma'] = df['volume'].rolling(20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma']
        df['obv'] = talib.OBV(df['close'].values, df['volume'].values)
        
        # Price patterns
        df['doji'] = talib.CDLDOJI(df['open'].values, df['high'].values, df['low'].values, df['close'].values)
        df['hammer'] = talib.CDLHAMMER(df['open'].values, df['high'].values, df['low'].values, df['close'].values)
        df['engulfing'] = talib.CDLENGULFING(df['open'].values, df['high'].values, df['low'].values, df['close'].values)
        
        # Market microstructure
        df['spread'] = (df['high'] - df['low']) / df['close']
        df['price_position'] = (df['close'] - df['low']) / (df['high'] - df['low'])
        
        # Time-based features
        df['hour'] = df.index.hour if hasattr(df.index, 'hour') else 0
        df['day_of_week'] = df.index.dayofweek if hasattr(df.index, 'dayofweek') else 0
        
        return df.dropna()
    
    async def train_prediction_model(self, symbol: str, data: pd.DataFrame, target_horizon: int = 5):
        """Train ML model for price prediction"""
        try:
            # Generate features
            df = await self.generate_features(data)
            
            # Create target variable (future returns)
            df['target'] = df['returns'].shift(-target_horizon)
            df = df.dropna()
            
            # Select features
            feature_cols = [col for col in df.columns if col not in ['target', 'open', 'high', 'low', 'close', 'volume']]
            X = df[feature_cols]
            y = df['target']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train ensemble model
            rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
            gb_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
            
            rf_model.fit(X_train_scaled, y_train)
            gb_model.fit(X_train_scaled, y_train)
            
            # Train neural network
            nn_model = keras.Sequential([
                keras.layers.Dense(128, activation='relu', input_shape=(X_train_scaled.shape[1],)),
                keras.layers.Dropout(0.3),
                keras.layers.Dense(64, activation='relu'),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dense(1)
            ])
            
            nn_model.compile(optimizer='adam', loss='mse', metrics=['mae'])
            nn_model.fit(X_train_scaled, y_train, epochs=50, batch_size=32, validation_split=0.2, verbose=0)
            
            # Store models
            self.models[symbol] = {
                'rf': rf_model,
                'gb': gb_model,
                'nn': nn_model,
                'features': feature_cols
            }
            self.scalers[symbol] = scaler
            
            # Feature importance
            self.feature_importance[symbol] = dict(zip(feature_cols, rf_model.feature_importances_))
            
            logger.info(f"Trained prediction models for {symbol}")
            return True
            
        except Exception as e:
            logger.error(f"Error training model for {symbol}: {e}")
            return False
    
    async def generate_prediction(self, symbol: str, current_data: pd.DataFrame) -> Dict[str, Any]:
        """Generate real-time predictions"""
        try:
            if symbol not in self.models:
                return {"error": "Model not trained for symbol"}
            
            # Generate features for current data
            df = await self.generate_features(current_data)
            if df.empty:
                return {"error": "Insufficient data for prediction"}
            
            # Get latest features
            feature_cols = self.models[symbol]['features']
            X = df[feature_cols].iloc[-1:].values
            X_scaled = self.scalers[symbol].transform(X)
            
            # Get predictions from ensemble
            rf_pred = self.models[symbol]['rf'].predict(X_scaled)[0]
            gb_pred = self.models[symbol]['gb'].predict(X_scaled)[0]
            nn_pred = self.models[symbol]['nn'].predict(X_scaled)[0][0]
            
            # Ensemble prediction
            ensemble_pred = (rf_pred + gb_pred + nn_pred) / 3
            
            # Calculate confidence based on model agreement
            predictions = [rf_pred, gb_pred, nn_pred]
            confidence = 1.0 - (np.std(predictions) / np.mean(np.abs(predictions)))
            
            # Generate signal strength
            signal_strength = min(abs(ensemble_pred) * 100, 100)
            signal_direction = "BUY" if ensemble_pred > 0 else "SELL"
            
            prediction = {
                "symbol": symbol,
                "timestamp": datetime.now().isoformat(),
                "prediction": float(ensemble_pred),
                "confidence": float(confidence),
                "signal_direction": signal_direction,
                "signal_strength": float(signal_strength),
                "individual_predictions": {
                    "random_forest": float(rf_pred),
                    "gradient_boosting": float(gb_pred),
                    "neural_network": float(nn_pred)
                },
                "feature_importance": self.feature_importance.get(symbol, {})
            }
            
            # Cache prediction
            self.prediction_cache[symbol] = prediction
            return prediction
            
        except Exception as e:
            logger.error(f"Error generating prediction for {symbol}: {e}")
            return {"error": str(e)}
    
    async def auto_generate_strategy(self, symbol: str, market_conditions: Dict[str, Any]) -> Dict[str, Any]:
        """Auto-generate trading strategy based on market conditions"""
        try:
            # Analyze market conditions
            volatility = market_conditions.get('volatility', 0.02)
            trend_strength = market_conditions.get('trend_strength', 0.5)
            volume_profile = market_conditions.get('volume_profile', 'normal')
            
            # Select strategy template based on conditions
            if volatility < 0.01 and trend_strength < 0.3:
                strategy_type = "mean_reversion"
            elif volatility > 0.05 and volume_profile == 'high':
                strategy_type = "breakout"
            elif trend_strength > 0.7:
                strategy_type = "momentum"
            else:
                strategy_type = "scalping"
            
            template = self.strategy_templates[strategy_type]
            
            # Generate dynamic parameters
            strategy = {
                "id": f"{strategy_type}_{symbol}_{int(datetime.now().timestamp())}",
                "name": f"Auto-{strategy_type.title()} Strategy",
                "symbol": symbol,
                "type": strategy_type,
                "created_at": datetime.now().isoformat(),
                "parameters": {
                    "timeframe": self._select_optimal_timeframe(volatility, trend_strength),
                    "indicators": template["indicators"],
                    "entry_conditions": self._generate_entry_conditions(strategy_type, market_conditions),
                    "exit_conditions": self._generate_exit_conditions(strategy_type, market_conditions),
                    "risk_management": self._generate_risk_params(template["risk_params"], volatility),
                    "position_sizing": self._calculate_position_size(volatility, market_conditions)
                },
                "expected_performance": {
                    "win_rate": self._estimate_win_rate(strategy_type, market_conditions),
                    "avg_return": self._estimate_avg_return(strategy_type, volatility),
                    "max_drawdown": template["risk_params"]["max_drawdown"]
                },
                "market_conditions": market_conditions
            }
            
            logger.info(f"Generated auto-strategy: {strategy['name']} for {symbol}")
            return strategy
            
        except Exception as e:
            logger.error(f"Error generating strategy for {symbol}: {e}")
            return {"error": str(e)}
    
    def _select_optimal_timeframe(self, volatility: float, trend_strength: float) -> str:
        """Select optimal timeframe based on market conditions"""
        if volatility > 0.05:
            return "1m"  # High volatility, shorter timeframe
        elif trend_strength > 0.7:
            return "15m"  # Strong trend, medium timeframe
        else:
            return "5m"  # Default
    
    def _generate_entry_conditions(self, strategy_type: str, conditions: Dict[str, Any]) -> List[str]:
        """Generate entry conditions based on strategy type"""
        base_conditions = {
            "momentum": [
                "RSI > 60 AND MACD > MACD_Signal",
                "Close > BB_Upper",
                "Volume > Volume_SMA * 1.5"
            ],
            "mean_reversion": [
                "RSI < 30 OR RSI > 70",
                "Close < BB_Lower OR Close > BB_Upper",
                "Williams %R < -80 OR Williams %R > -20"
            ],
            "breakout": [
                "Close > Donchian_Upper",
                "Volume > Volume_SMA * 2.0",
                "ATR > ATR_SMA * 1.2"
            ],
            "scalping": [
                "Close > VWAP AND EMA_Fast > EMA_Slow",
                "Orderbook_Imbalance > 0.6",
                "Tick_Volume > Avg_Tick_Volume * 1.3"
            ]
        }
        return base_conditions.get(strategy_type, [])
    
    def _generate_exit_conditions(self, strategy_type: str, conditions: Dict[str, Any]) -> List[str]:
        """Generate exit conditions based on strategy type"""
        base_conditions = {
            "momentum": [
                "RSI < 40",
                "MACD < MACD_Signal",
                "Stop_Loss: -2% OR Take_Profit: +4%"
            ],
            "mean_reversion": [
                "RSI between 40-60",
                "Close crosses BB_Middle",
                "Stop_Loss: -1.5% OR Take_Profit: +2%"
            ],
            "breakout": [
                "Close < Donchian_Middle",
                "Volume < Volume_SMA",
                "Stop_Loss: -3% OR Take_Profit: +6%"
            ],
            "scalping": [
                "Close < VWAP",
                "Orderbook_Imbalance < 0.4",
                "Stop_Loss: -0.5% OR Take_Profit: +1%"
            ]
        }
        return base_conditions.get(strategy_type, [])
    
    def _generate_risk_params(self, base_params: Dict[str, float], volatility: float) -> Dict[str, float]:
        """Generate dynamic risk parameters"""
        return {
            "max_drawdown": base_params["max_drawdown"] * (1 + volatility * 2),
            "stop_loss": min(0.005, volatility * 2),
            "take_profit": min(0.02, volatility * 4),
            "max_positions": max(1, int(10 / (volatility * 100)))
        }
    
    def _calculate_position_size(self, volatility: float, conditions: Dict[str, Any]) -> float:
        """Calculate optimal position size"""
        base_size = 0.02
        vol_adjustment = max(0.5, 1 / (volatility * 50))
        return min(0.05, base_size * vol_adjustment)
    
    def _estimate_win_rate(self, strategy_type: str, conditions: Dict[str, Any]) -> float:
        """Estimate win rate based on strategy type and conditions"""
        base_rates = {
            "momentum": 0.55,
            "mean_reversion": 0.65,
            "breakout": 0.45,
            "scalping": 0.60
        }
        return base_rates.get(strategy_type, 0.5)
    
    def _estimate_avg_return(self, strategy_type: str, volatility: float) -> float:
        """Estimate average return based on strategy and volatility"""
        base_returns = {
            "momentum": 0.008,
            "mean_reversion": 0.005,
            "breakout": 0.012,
            "scalping": 0.003
        }
        return base_returns.get(strategy_type, 0.005) * (1 + volatility * 5)