"""
Reinforcement Learning Agent for dynamic strategy tuning
Includes SMC threshold tuning (ZQS_min, FVG_min_atr)
"""

from typing import List, Tuple, Dict, Any
import random
from backend.core.config import load_ai_config, save_ai_config


# Action space: (parameter_name, delta)
ACTIONS: List[Tuple[str, float]] = [
    # Weight adjustments
    ("RSI", +0.02), ("RSI", -0.02),
    ("MACD", +0.02), ("MACD", -0.02),
    ("SMC_ZQS", +0.02), ("SMC_ZQS", -0.02),
    ("LIQ_GRAB", +0.02), ("LIQ_GRAB", -0.02),
    ("FVG_ATR", +0.02), ("FVG_ATR", -0.02),
    ("Sentiment", +0.02), ("Sentiment", -0.02),
    ("SAR", +0.02), ("SAR", -0.02),
    
    # Threshold adjustments
    ("EntryScore", +0.02), ("EntryScore", -0.02),
    ("ConfluenceScore", +0.02), ("ConfluenceScore", -0.02),
    
    # SMC threshold tuning (NEW)
    ("ZQS_min", +0.02), ("ZQS_min", -0.02),
    ("FVG_min_atr", +0.02), ("FVG_min_atr", -0.02)
]


# Parameter bounds
BOUNDS: Dict[str, Tuple[float, float]] = {
    # Weights (0..1)
    "RSI": (0.05, 0.40),
    "MACD": (0.05, 0.40),
    "SMC_ZQS": (0.10, 0.50),
    "LIQ_GRAB": (0.05, 0.30),
    "FVG_ATR": (0.05, 0.30),
    "Sentiment": (0.05, 0.40),
    "SAR": (0.05, 0.30),
    
    # Thresholds
    "EntryScore": (0.50, 0.85),
    "ConfluenceScore": (0.45, 0.80),
    "ZQS_min": (0.40, 0.80),
    "FVG_min_atr": (0.05, 0.35)
}


class RLAgent:
    """
    Simple Q-learning agent for strategy parameter tuning
    """
    
    def __init__(self, epsilon: float = 0.15, learning_rate: float = 0.1, gamma: float = 0.95):
        """
        Initialize RL agent
        
        Args:
            epsilon: Exploration rate (0..1)
            learning_rate: Learning rate for Q-updates
            gamma: Discount factor for future rewards
        """
        self.epsilon = epsilon
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.q_table: Dict[int, float] = {}  # action_idx -> Q-value
        
    def select_action(self) -> int:
        """
        Select action using epsilon-greedy policy
        
        Returns:
            Index of selected action in ACTIONS list
        """
        # Epsilon-greedy exploration
        if random.random() < self.epsilon:
            return random.randint(0, len(ACTIONS) - 1)
        
        # Greedy: select action with highest Q-value
        if not self.q_table:
            return random.randint(0, len(ACTIONS) - 1)
        
        best_action = max(self.q_table, key=self.q_table.get)
        return best_action
    
    def apply_action(self, action_idx: int) -> Dict[str, Any]:
        """
        Apply selected action to current configuration
        
        Args:
            action_idx: Index of action in ACTIONS list
        
        Returns:
            Updated configuration dictionary
        """
        param_name, delta = ACTIONS[action_idx]
        
        # Load current config
        cfg = load_ai_config()
        
        # Determine which section to update
        if param_name in ["RSI", "MACD", "SMC_ZQS", "LIQ_GRAB", "FVG_ATR", "Sentiment", "SAR"]:
            section = "weights"
        elif param_name in ["EntryScore", "ConfluenceScore", "ZQS_min", "FVG_min_atr"]:
            section = "thresholds"
        else:
            # Unknown parameter
            return cfg
        
        # Apply delta
        current_value = cfg.get(section, {}).get(param_name, 0.0)
        new_value = current_value + delta
        
        # Clip to bounds
        if param_name in BOUNDS:
            min_val, max_val = BOUNDS[param_name]
            new_value = max(min_val, min(new_value, max_val))
        
        # Update config
        if section not in cfg:
            cfg[section] = {}
        cfg[section][param_name] = new_value
        
        # Normalize weights if needed
        if section == "weights":
            self._normalize_weights(cfg)
        
        return cfg
    
    def update_q(self, action_idx: int, reward: float, next_max_q: float = 0.0):
        """
        Update Q-value for action using Q-learning update rule
        
        Args:
            action_idx: Index of action taken
            reward: Reward received
            next_max_q: Max Q-value of next state (default 0.0)
        """
        current_q = self.q_table.get(action_idx, 0.0)
        
        # Q-learning update: Q(s,a) ← Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
        new_q = current_q + self.learning_rate * (reward + self.gamma * next_max_q - current_q)
        
        self.q_table[action_idx] = new_q
    
    def _normalize_weights(self, cfg: Dict[str, Any]):
        """
        Normalize weights to sum to 1.0
        
        Args:
            cfg: Configuration dictionary (modified in-place)
        """
        weights = cfg.get("weights", {})
        total = sum(weights.values())
        
        if total > 0:
            for key in weights:
                weights[key] /= total
    
    def save_state(self, path: str = "backend/ai/rl_state.json"):
        """
        Save Q-table to file
        
        Args:
            path: Path to save file
        """
        import json
        from pathlib import Path
        
        state = {
            "q_table": {str(k): v for k, v in self.q_table.items()},
            "epsilon": self.epsilon,
            "learning_rate": self.learning_rate,
            "gamma": self.gamma
        }
        
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w') as f:
            json.dump(state, f, indent=2)
    
    def load_state(self, path: str = "backend/ai/rl_state.json"):
        """
        Load Q-table from file
        
        Args:
            path: Path to load file
        """
        import json
        from pathlib import Path
        
        if not Path(path).exists():
            return
        
        with open(path, 'r') as f:
            state = json.load(f)
        
        self.q_table = {int(k): v for k, v in state.get("q_table", {}).items()}
        self.epsilon = state.get("epsilon", self.epsilon)
        self.learning_rate = state.get("learning_rate", self.learning_rate)
        self.gamma = state.get("gamma", self.gamma)