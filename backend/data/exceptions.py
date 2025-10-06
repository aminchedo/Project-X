"""
Custom exceptions for data providers
Production-grade error handling for AiSmartHTS Trading System
"""

class DataProviderError(Exception):
    """Base exception for all data provider errors"""
    pass

class RateLimitError(DataProviderError):
    """Hit rate limit - backoff required"""
    pass

class InvalidResponseError(DataProviderError):
    """Provider returned malformed data"""
    pass

class SymbolNotFoundError(DataProviderError):
    """Symbol doesn't exist on the exchange"""
    pass

class ConnectionError(DataProviderError):
    """Network connection failed"""
    pass

class TimeoutError(DataProviderError):
    """Request timed out"""
    pass

class AuthenticationError(DataProviderError):
    """API authentication failed"""
    pass

class InsufficientDataError(DataProviderError):
    """Not enough data points returned"""
    pass
