import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class NotificationSettings:
    bot_token: str
    chat_id: str
    signal_alerts: bool = True
    portfolio_alerts: bool = True
    risk_alerts: bool = True
    api_health_alerts: bool = True
    daily_summary: bool = True
    min_confidence_threshold: float = 0.7


class TelegramNotifier:
    def __init__(self, bot_token: Optional[str] = None, chat_id: Optional[str] = None):
        self.bot_token = bot_token or os.getenv('TELEGRAM_BOT_TOKEN')
        self.chat_id = chat_id or os.getenv('TELEGRAM_CHAT_ID')
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
        
        self.settings = NotificationSettings(
            bot_token=self.bot_token,
            chat_id=self.chat_id
        )
        
        # Rate limiting
        self.last_message_time = {}
        self.min_interval = 5  # Minimum 5 seconds between similar messages
        
    async def send_signal_alert(self, signal: Dict) -> bool:
        """Send trading signal alert to Telegram"""
        if not self.settings.signal_alerts:
            return False
            
        try:
            # Check confidence threshold
            if signal.get('confidence', 0) < self.settings.min_confidence_threshold:
                return False
            
            # Check rate limiting
            if not self._check_rate_limit('signal_alert'):
                return False
            
            # Format signal message
            message = self._format_signal_message(signal)
            
            # Send message
            success = await self._send_message(message, parse_mode='HTML')
            
            if success:
                self.last_message_time['signal_alert'] = datetime.now()
            
            return success
            
        except Exception as e:
            print(f"Error sending signal alert: {str(e)}")
            return False
    
    async def send_portfolio_alert(self, portfolio_status: Dict) -> bool:
        """Send portfolio status alert"""
        if not self.settings.portfolio_alerts:
            return False
            
        try:
            # Check if significant change warrants alert
            if not self._should_send_portfolio_alert(portfolio_status):
                return False
            
            # Check rate limiting
            if not self._check_rate_limit('portfolio_alert'):
                return False
            
            # Format portfolio message
            message = self._format_portfolio_message(portfolio_status)
            
            # Send message
            success = await self._send_message(message, parse_mode='HTML')
            
            if success:
                self.last_message_time['portfolio_alert'] = datetime.now()
            
            return success
            
        except Exception as e:
            print(f"Error sending portfolio alert: {str(e)}")
            return False
    
    async def send_risk_alert(self, risk_data: Dict) -> bool:
        """Send risk management alert"""
        if not self.settings.risk_alerts:
            return False
            
        try:
            # Check rate limiting
            if not self._check_rate_limit('risk_alert'):
                return False
            
            # Format risk message
            message = self._format_risk_message(risk_data)
            
            # Send message with high priority
            success = await self._send_message(message, parse_mode='HTML')
            
            if success:
                self.last_message_time['risk_alert'] = datetime.now()
            
            return success
            
        except Exception as e:
            print(f"Error sending risk alert: {str(e)}")
            return False
    
    async def send_api_health_alert(self, failed_apis: List[str], status_data: Dict) -> bool:
        """Send API health degradation alert"""
        if not self.settings.api_health_alerts:
            return False
            
        try:
            # Check rate limiting
            if not self._check_rate_limit('api_health_alert'):
                return False
            
            # Format API health message
            message = self._format_api_health_message(failed_apis, status_data)
            
            # Send message
            success = await self._send_message(message, parse_mode='HTML')
            
            if success:
                self.last_message_time['api_health_alert'] = datetime.now()
            
            return success
            
        except Exception as e:
            print(f"Error sending API health alert: {str(e)}")
            return False
    
    async def send_daily_summary(self, summary_data: Dict) -> bool:
        """Send daily trading summary"""
        if not self.settings.daily_summary:
            return False
            
        try:
            # Format daily summary message
            message = self._format_daily_summary(summary_data)
            
            # Send message
            success = await self._send_message(message, parse_mode='HTML')
            
            return success
            
        except Exception as e:
            print(f"Error sending daily summary: {str(e)}")
            return False
    
    def _format_signal_message(self, signal: Dict) -> str:
        """Format trading signal for Telegram"""
        action = signal.get('action', 'UNKNOWN')
        symbol = signal.get('symbol', 'UNKNOWN')
        confidence = signal.get('confidence', 0) * 100
        price = signal.get('price', 0)
        final_score = signal.get('final_score', 0)
        
        # Choose emoji based on action
        if action == 'BUY':
            emoji = "🟢"
            action_emoji = "📈"
        elif action == 'SELL':
            emoji = "🔴"
            action_emoji = "📉"
        else:
            emoji = "⚪"
            action_emoji = "⏸️"
        
        # Confidence level emoji
        if confidence >= 90:
            conf_emoji = "🔥"
        elif confidence >= 80:
            conf_emoji = "💪"
        elif confidence >= 70:
            conf_emoji = "✅"
        else:
            conf_emoji = "⚠️"
        
        message = f"""
{emoji} <b>HTS TRADING SIGNAL</b> {action_emoji}

<b>Symbol:</b> {symbol}
<b>Action:</b> {action}
<b>Price:</b> ${price:,.4f}
<b>Confidence:</b> {confidence:.1f}% {conf_emoji}
<b>Final Score:</b> {final_score:.3f}

<b>Component Breakdown:</b>
• RSI/MACD: {signal.get('rsi_macd_score', 0):.3f}
• Smart Money: {signal.get('smc_score', 0):.3f}
• Patterns: {signal.get('pattern_score', 0):.3f}
• Sentiment: {signal.get('sentiment_score', 0):.3f}
• ML Prediction: {signal.get('ml_score', 0):.3f}

⏰ <i>{signal.get('timestamp', datetime.now()).strftime('%Y-%m-%d %H:%M:%S UTC')}</i>
        """.strip()
        
        return message
    
    def _format_portfolio_message(self, portfolio: Dict) -> str:
        """Format portfolio status for Telegram"""
        total_value = portfolio.get('portfolio_value', 0)
        total_return = portfolio.get('total_return', 0)
        total_return_pct = portfolio.get('total_return_pct', 0)
        unrealized_pnl = portfolio.get('unrealized_pnl', 0)
        realized_pnl = portfolio.get('realized_pnl', 0)
        
        # Choose emoji based on performance
        if total_return_pct > 5:
            perf_emoji = "🚀"
        elif total_return_pct > 0:
            perf_emoji = "📈"
        elif total_return_pct > -5:
            perf_emoji = "📊"
        else:
            perf_emoji = "📉"
        
        message = f"""
💼 <b>PORTFOLIO UPDATE</b> {perf_emoji}

<b>Total Value:</b> ${total_value:,.2f}
<b>Total Return:</b> ${total_return:,.2f} ({total_return_pct:+.2f}%)
<b>Realized P&L:</b> ${realized_pnl:,.2f}
<b>Unrealized P&L:</b> ${unrealized_pnl:,.2f}

<b>Open Positions:</b> {portfolio.get('open_positions_count', 0)}
<b>Completed Trades:</b> {portfolio.get('completed_trades_count', 0)}

⏰ <i>{datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</i>
        """.strip()
        
        return message
    
    def _format_risk_message(self, risk_data: Dict) -> str:
        """Format risk alert for Telegram"""
        alert_type = risk_data.get('alert_type', 'UNKNOWN')
        severity = risk_data.get('severity', 'MEDIUM')
        
        # Choose emoji based on severity
        if severity == 'HIGH':
            emoji = "🚨"
        elif severity == 'MEDIUM':
            emoji = "⚠️"
        else:
            emoji = "ℹ️"
        
        message = f"""
{emoji} <b>RISK ALERT - {severity}</b>

<b>Alert Type:</b> {alert_type}
<b>Current Risk Level:</b> {risk_data.get('risk_level', 'N/A')}
<b>Description:</b> {risk_data.get('description', 'Risk threshold exceeded')}

<b>Recommended Action:</b> {risk_data.get('recommendation', 'Review positions')}

⏰ <i>{datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</i>
        """.strip()
        
        return message
    
    def _format_api_health_message(self, failed_apis: List[str], status_data: Dict) -> str:
        """Format API health alert for Telegram"""
        total_apis = status_data.get('total_endpoints', 0)
        healthy_apis = status_data.get('healthy_endpoints', 0)
        health_percentage = (healthy_apis / total_apis * 100) if total_apis > 0 else 0
        
        # Choose emoji based on health percentage
        if health_percentage >= 90:
            health_emoji = "🟢"
        elif health_percentage >= 70:
            health_emoji = "🟡"
        else:
            health_emoji = "🔴"
        
        message = f"""
🔧 <b>API HEALTH ALERT</b> {health_emoji}

<b>System Health:</b> {health_percentage:.1f}%
<b>Healthy APIs:</b> {healthy_apis}/{total_apis}

<b>Failed APIs:</b>
{chr(10).join([f"• {api}" for api in failed_apis[:5]])}
{f"... and {len(failed_apis)-5} more" if len(failed_apis) > 5 else ""}

<b>Impact:</b> {status_data.get('impact_assessment', 'Monitoring situation')}

⏰ <i>{datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</i>
        """.strip()
        
        return message
    
    def _format_daily_summary(self, summary: Dict) -> str:
        """Format daily summary for Telegram"""
        total_signals = summary.get('total_signals', 0)
        successful_trades = summary.get('successful_trades', 0)
        daily_pnl = summary.get('daily_pnl', 0)
        win_rate = summary.get('win_rate', 0)
        
        # Choose emoji based on daily performance
        if daily_pnl > 0:
            day_emoji = "📈"
        elif daily_pnl == 0:
            day_emoji = "📊"
        else:
            day_emoji = "📉"
        
        message = f"""
📊 <b>DAILY TRADING SUMMARY</b> {day_emoji}

<b>Date:</b> {datetime.now().strftime('%Y-%m-%d')}

<b>Signals Generated:</b> {total_signals}
<b>Trades Executed:</b> {successful_trades}
<b>Win Rate:</b> {win_rate:.1f}%
<b>Daily P&L:</b> ${daily_pnl:,.2f}

<b>Top Performer:</b> {summary.get('best_performer', 'N/A')}
<b>System Health:</b> {summary.get('system_health', 'Good')}

🎯 <i>Keep trading smart with HTS!</i>
        """.strip()
        
        return message
    
    async def _send_message(self, text: str, parse_mode: str = 'HTML') -> bool:
        """Send message to Telegram"""
        if not self.bot_token or not self.chat_id:
            print("Warning: Telegram bot token or chat ID not configured")
            return False
        
        try:
            url = f"{self.base_url}/sendMessage"
            
            payload = {
                'chat_id': self.chat_id,
                'text': text,
                'parse_mode': parse_mode,
                'disable_web_page_preview': True
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        return True
                    else:
                        error_text = await response.text()
                        print(f"Telegram API error: {response.status} - {error_text}")
                        return False
                        
        except Exception as e:
            print(f"Error sending Telegram message: {str(e)}")
            return False
    
    def _check_rate_limit(self, message_type: str) -> bool:
        """Check if message should be sent based on rate limiting"""
        last_time = self.last_message_time.get(message_type)
        
        if not last_time:
            return True
        
        time_diff = (datetime.now() - last_time).total_seconds()
        return time_diff >= self.min_interval
    
    def _should_send_portfolio_alert(self, portfolio: Dict) -> bool:
        """Determine if portfolio change is significant enough for alert"""
        total_return_pct = portfolio.get('total_return_pct', 0)
        
        # Send alert for significant gains/losses
        if abs(total_return_pct) >= 5:  # 5% change
            return True
        
        # Send alert for drawdown warnings
        unrealized_pnl = portfolio.get('unrealized_pnl', 0)
        if unrealized_pnl < -1000:  # $1000+ unrealized loss
            return True
        
        return False
    
    async def test_connection(self) -> Dict:
        """Test Telegram bot connection"""
        try:
            url = f"{self.base_url}/getMe"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "status": "success",
                            "bot_info": data.get('result', {}),
                            "configured": bool(self.bot_token and self.chat_id)
                        }
                    else:
                        return {
                            "status": "error",
                            "error": f"HTTP {response.status}",
                            "configured": bool(self.bot_token and self.chat_id)
                        }
                        
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "configured": bool(self.bot_token and self.chat_id)
            }
    
    def update_settings(self, settings: Dict) -> bool:
        """Update notification settings"""
        try:
            if 'signal_alerts' in settings:
                self.settings.signal_alerts = settings['signal_alerts']
            if 'portfolio_alerts' in settings:
                self.settings.portfolio_alerts = settings['portfolio_alerts']
            if 'risk_alerts' in settings:
                self.settings.risk_alerts = settings['risk_alerts']
            if 'api_health_alerts' in settings:
                self.settings.api_health_alerts = settings['api_health_alerts']
            if 'daily_summary' in settings:
                self.settings.daily_summary = settings['daily_summary']
            if 'min_confidence_threshold' in settings:
                self.settings.min_confidence_threshold = settings['min_confidence_threshold']
            if 'chat_id' in settings:
                self.settings.chat_id = settings['chat_id']
                self.chat_id = settings['chat_id']
            
            return True
            
        except Exception as e:
            print(f"Error updating notification settings: {str(e)}")
            return False
    
    def get_settings(self) -> Dict:
        """Get current notification settings"""
        return {
            "signal_alerts": self.settings.signal_alerts,
            "portfolio_alerts": self.settings.portfolio_alerts,
            "risk_alerts": self.settings.risk_alerts,
            "api_health_alerts": self.settings.api_health_alerts,
            "daily_summary": self.settings.daily_summary,
            "min_confidence_threshold": self.settings.min_confidence_threshold,
            "chat_id": self.settings.chat_id,
            "bot_configured": bool(self.bot_token and self.chat_id)
        }


# Global Telegram notifier instance
telegram_notifier = TelegramNotifier()