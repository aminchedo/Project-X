"""
Genetic Algorithm for strategy parameter calibration
Placeholder for GA optimization (can be expanded later)
"""

from typing import List, Dict, Any
import random
from backend.core.config import load_ai_config, save_ai_config


class GACalibrator:
    """
    Genetic Algorithm for optimizing strategy parameters
    """
    
    def __init__(
        self,
        population_size: int = 20,
        mutation_rate: float = 0.15,
        crossover_rate: float = 0.7
    ):
        """
        Initialize GA calibrator
        
        Args:
            population_size: Number of individuals in population
            mutation_rate: Probability of mutation
            crossover_rate: Probability of crossover
        """
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.population: List[Dict[str, Any]] = []
    
    def initialize_population(self):
        """
        Initialize random population of configurations
        """
        base_config = load_ai_config()
        
        for _ in range(self.population_size):
            # Create variant by mutating base config
            individual = self._mutate(base_config.copy())
            self.population.append(individual)
    
    def _mutate(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mutate configuration parameters
        
        Args:
            config: Configuration to mutate
        
        Returns:
            Mutated configuration
        """
        # Simple mutation: add random noise to weights and thresholds
        if random.random() < self.mutation_rate:
            weights = config.get("weights", {})
            for key in weights:
                weights[key] += random.uniform(-0.05, 0.05)
                weights[key] = max(0.05, min(0.50, weights[key]))
            
            # Normalize
            total = sum(weights.values())
            for key in weights:
                weights[key] /= total
        
        if random.random() < self.mutation_rate:
            thresholds = config.get("thresholds", {})
            for key in thresholds:
                thresholds[key] += random.uniform(-0.05, 0.05)
                thresholds[key] = max(0.40, min(0.85, thresholds[key]))
        
        return config
    
    def evolve(self, fitness_scores: List[float]) -> List[Dict[str, Any]]:
        """
        Evolve population using selection, crossover, and mutation
        
        Args:
            fitness_scores: Fitness score for each individual
        
        Returns:
            New population
        """
        # Select top performers
        sorted_pop = sorted(
            zip(self.population, fitness_scores),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Keep top 50%
        elite = [ind for ind, _ in sorted_pop[:self.population_size // 2]]
        
        # Generate offspring
        new_population = elite.copy()
        
        while len(new_population) < self.population_size:
            # Crossover
            parent1 = random.choice(elite)
            parent2 = random.choice(elite)
            
            if random.random() < self.crossover_rate:
                child = self._crossover(parent1, parent2)
            else:
                child = parent1.copy()
            
            # Mutate
            child = self._mutate(child)
            new_population.append(child)
        
        self.population = new_population
        return self.population
    
    def _crossover(self, parent1: Dict[str, Any], parent2: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform crossover between two parents
        
        Args:
            parent1: First parent configuration
            parent2: Second parent configuration
        
        Returns:
            Child configuration
        """
        child = {}
        
        # Mix weights
        child["weights"] = {}
        for key in parent1.get("weights", {}):
            child["weights"][key] = random.choice([
                parent1["weights"][key],
                parent2["weights"][key]
            ])
        
        # Mix thresholds
        child["thresholds"] = {}
        for key in parent1.get("thresholds", {}):
            child["thresholds"][key] = random.choice([
                parent1["thresholds"][key],
                parent2.get("thresholds", {}).get(key, parent1["thresholds"][key])
            ])
        
        # Copy other sections from parent1
        for key in parent1:
            if key not in ["weights", "thresholds"]:
                child[key] = parent1[key]
        
        return child