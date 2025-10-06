import logging
import sys
from datetime import datetime
from pathlib import Path
import json
from typing import Dict, Any

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.setup_logging()
    
    def setup_logging(self):
        # Create logs directory
        Path("logs").mkdir(exist_ok=True)
        
        # Configure formatters
        structured_formatter = StructuredFormatter()
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # File handler for all logs
        file_handler = logging.FileHandler(f"logs/hts_trading_{datetime.now().strftime('%Y%m%d')}.log")
        file_handler.setFormatter(structured_formatter)
        file_handler.setLevel(logging.INFO)
        
        # Error file handler
        error_handler = logging.FileHandler(f"logs/errors_{datetime.now().strftime('%Y%m%d')}.log")
        error_handler.setFormatter(structured_formatter)
        error_handler.setLevel(logging.ERROR)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(logging.INFO)
        
        # Configure logger
        self.logger.setLevel(logging.INFO)
        self.logger.addHandler(file_handler)
        self.logger.addHandler(error_handler)
        self.logger.addHandler(console_handler)
    
    def log_signal_generated(self, signal_data: Dict[str, Any]):
        self.logger.info("SIGNAL_GENERATED", extra={
            "event_type": "signal_generated",
            "symbol": signal_data.get("symbol"),
            "action": signal_data.get("action"),
            "confidence": signal_data.get("confidence"),
            "final_score": signal_data.get("final_score")
        })
    
    def log_trade_executed(self, trade_data: Dict[str, Any]):
        self.logger.info("TRADE_EXECUTED", extra={
            "event_type": "trade_executed",
            "symbol": trade_data.get("symbol"),
            "side": trade_data.get("side"),
            "quantity": trade_data.get("quantity"),
            "price": trade_data.get("price")
        })
    
    def log_api_request(self, endpoint: str, method: str, response_time: float, status_code: int):
        self.logger.info("API_REQUEST", extra={
            "event_type": "api_request",
            "endpoint": endpoint,
            "method": method,
            "response_time": response_time,
            "status_code": status_code
        })
    
    def log_error(self, error_type: str, error_message: str, context: Dict[str, Any] = None):
        self.logger.error("ERROR_OCCURRED", extra={
            "event_type": "error",
            "error_type": error_type,
            "error_message": error_message,
            "context": context or {}
        })

    def log_risk_event(self, event_type: str, risk_data: Dict[str, Any]):
        self.logger.warning("RISK_EVENT", extra={
            "event_type": "risk_event",
            "risk_type": event_type,
            "data": risk_data
        })
    
    def log_performance_metric(self, metric_name: str, value: float, metadata: Dict[str, Any] = None):
        self.logger.info("PERFORMANCE_METRIC", extra={
            "event_type": "performance_metric",
            "metric_name": metric_name,
            "value": value,
            "metadata": metadata or {}
        })
    
    def log_system_event(self, event_type: str, message: str, data: Dict[str, Any] = None):
        self.logger.info(f"SYSTEM_EVENT: {event_type} - {message}", extra={
            "event_type": "system_event",
            "system_event_type": event_type,
            "event_data": data or {}
        })

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add extra fields
        if hasattr(record, 'event_type'):
            log_entry["event_type"] = record.event_type
            
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'lineno', 'funcName', 'created', 
                          'msecs', 'relativeCreated', 'thread', 'threadName', 
                          'processName', 'process', 'getMessage', 'exc_info', 
                          'exc_text', 'stack_info', 'message']:
                log_entry[key] = value
        
        return json.dumps(log_entry)

class LogAnalyzer:
    """Utility class for analyzing log files"""
    
    def __init__(self, log_directory: str = "logs"):
        self.log_directory = Path(log_directory)
    
    def get_error_summary(self, date: str = None) -> Dict[str, Any]:
        """Get summary of errors for a specific date"""
        if date is None:
            date = datetime.now().strftime('%Y%m%d')
        
        error_file = self.log_directory / f"errors_{date}.log"
        if not error_file.exists():
            return {"error": "No error log found for date"}
        
        error_counts = {}
        total_errors = 0
        
        with open(error_file, 'r') as f:
            for line in f:
                try:
                    log_entry = json.loads(line.strip())
                    error_type = log_entry.get("error_type", "unknown")
                    error_counts[error_type] = error_counts.get(error_type, 0) + 1
                    total_errors += 1
                except json.JSONDecodeError:
                    continue
        
        return {
            "date": date,
            "total_errors": total_errors,
            "error_breakdown": error_counts
        }
    
    def get_performance_metrics(self, date: str = None) -> Dict[str, Any]:
        """Get performance metrics for a specific date"""
        if date is None:
            date = datetime.now().strftime('%Y%m%d')
        
        log_file = self.log_directory / f"hts_trading_{date}.log"
        if not log_file.exists():
            return {"error": "No log found for date"}
        
        api_requests = []
        performance_metrics = {}
        
        with open(log_file, 'r') as f:
            for line in f:
                try:
                    log_entry = json.loads(line.strip())
                    event_type = log_entry.get("event_type")
                    
                    if event_type == "api_request":
                        api_requests.append({
                            "endpoint": log_entry.get("endpoint"),
                            "method": log_entry.get("method"),
                            "response_time": log_entry.get("response_time"),
                            "status_code": log_entry.get("status_code")
                        })
                    elif event_type == "performance_metric":
                        metric_name = log_entry.get("metric_name")
                        value = log_entry.get("value")
                        if metric_name:
                            if metric_name not in performance_metrics:
                                performance_metrics[metric_name] = []
                            performance_metrics[metric_name].append(value)
                            
                except json.JSONDecodeError:
                    continue
        
        # Calculate API performance statistics
        api_stats = {}
        if api_requests:
            response_times = [req["response_time"] for req in api_requests if req["response_time"]]
            if response_times:
                api_stats = {
                    "total_requests": len(api_requests),
                    "avg_response_time": sum(response_times) / len(response_times),
                    "max_response_time": max(response_times),
                    "min_response_time": min(response_times)
                }
        
        return {
            "date": date,
            "api_performance": api_stats,
            "custom_metrics": performance_metrics
        }

# Global logger instance
app_logger = StructuredLogger("hts_trading")

# Convenience functions for common logging patterns
def log_signal(symbol: str, action: str, confidence: float, score: float):
    app_logger.log_signal_generated({
        "symbol": symbol,
        "action": action,
        "confidence": confidence,
        "final_score": score
    })

def log_trade(symbol: str, side: str, quantity: float, price: float):
    app_logger.log_trade_executed({
        "symbol": symbol,
        "side": side,
        "quantity": quantity,
        "price": price
    })

def log_error(error_type: str, message: str, context: Dict[str, Any] = None):
    app_logger.log_error(error_type, message, context)

def log_api_call(endpoint: str, method: str, response_time: float, status_code: int):
    app_logger.log_api_request(endpoint, method, response_time, status_code)

def log_risk_alert(alert_type: str, data: Dict[str, Any]):
    app_logger.log_risk_event(alert_type, data)

def log_performance(metric_name: str, value: float, metadata: Dict[str, Any] = None):
    app_logger.log_performance_metric(metric_name, value, metadata)