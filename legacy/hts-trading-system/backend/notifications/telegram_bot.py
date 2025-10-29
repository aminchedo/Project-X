"""
HTS Trading System - Telegram Bot
Real-time notifications and alerts.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from telegram import Bot, Update
from telegram.ext import Application, CommandHandler, ContextTypes

logger = logging.getLogger(__name__)

class TelegramBot:
    """Telegram bot for trading alerts and notifications"""
    
    def __init__(self, bot_token: Optional[str] = None):
        # Demo bot token (replace with real token in production)
        self.bot_token = bot_token or "YOUR_BOT_TOKEN_HERE"
        self.bot: Optional[Bot] = None
        self.application: Optional[Application] = None
        self.subscribers: List[str] = []  # Chat IDs of subscribers
        
        # Alert settings
        self.alert_settings = {
            "strong_signals": True,
            "portfolio_updates": True,
            "risk_alerts": True,
            "api_status": False,
            "trade_confirmations": True
        }
    
    async def initialize(self) -> bool:
        """Initialize the Telegram bot"""
        try:
            if self.bot_token == "YOUR_BOT_TOKEN_HERE":
                logger.warning("Demo bot token - Telegram notifications disabled")
                return False
            
            self.bot = Bot(token=self.bot_token)
            self.application = Application.builder().token(self.bot_token).build()
            
            # Add command handlers
            self.application.add_handler(CommandHandler("start", self.start_command))
            self.application.add_handler(CommandHandler("help", self.help_command))
            self.application.add_handler(CommandHandler("subscribe", self.subscribe_command))
            self.application.add_handler(CommandHandler("unsubscribe", self.unsubscribe_command))
            self.application.add_handler(CommandHandler("status", self.status_command))
            self.application.add_handler(CommandHandler("portfolio", self.portfolio_command))
            self.application.add_handler(CommandHandler("alerts", self.alerts_command))
            
            # Test connection
            bot_info = await self.bot.get_me()
            logger.info(f"Telegram bot initialized: @{bot_info.username}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error initializing Telegram bot: {str(e)}")
            return False
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        try:
            welcome_message = """
🚀 *HTS Trading System Bot*

Welcome to the High-Frequency Trading System notifications bot!

Available commands:
/help - Show all commands
/subscribe - Subscribe to notifications
/unsubscribe - Unsubscribe from notifications
/status - Get system status
/portfolio - Get portfolio summary
/alerts - Configure alert settings

The bot will send you real-time trading signals, portfolio updates, and important alerts.
            """
            
            await update.message.reply_text(
                welcome_message, 
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Error in start command: {str(e)}")
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        try:
            help_message = """
📚 *HTS Trading Bot Commands*

*Basic Commands:*
/start - Welcome message and setup
/help - Show this help message
/subscribe - Subscribe to notifications
/unsubscribe - Unsubscribe from notifications

*Information Commands:*
/status - Get system and API status
/portfolio - Get current portfolio summary
/signals - Get latest trading signals

*Configuration:*
/alerts - Configure notification settings
/settings - View current settings

*Notifications You'll Receive:*
🔥 Strong trading signals (BUY/SELL)
💰 Portfolio updates and P&L changes
⚠️ Risk alerts and limit breaches
🔧 System status and API health
✅ Trade confirmations

For support, contact the HTS team.
            """
            
            await update.message.reply_text(
                help_message, 
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Error in help command: {str(e)}")
    
    async def subscribe_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /subscribe command"""
        try:
            chat_id = str(update.effective_chat.id)
            
            if chat_id not in self.subscribers:
                self.subscribers.append(chat_id)
                message = "✅ You've successfully subscribed to HTS trading notifications!"
            else:
                message = "ℹ️ You're already subscribed to notifications."
            
            await update.message.reply_text(message)
            logger.info(f"User {chat_id} subscribed to notifications")
            
        except Exception as e:
            logger.error(f"Error in subscribe command: {str(e)}")
    
    async def unsubscribe_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /unsubscribe command"""
        try:
            chat_id = str(update.effective_chat.id)
            
            if chat_id in self.subscribers:
                self.subscribers.remove(chat_id)
                message = "❌ You've been unsubscribed from HTS trading notifications."
            else:
                message = "ℹ️ You're not currently subscribed to notifications."
            
            await update.message.reply_text(message)
            logger.info(f"User {chat_id} unsubscribed from notifications")
            
        except Exception as e:
            logger.error(f"Error in unsubscribe command: {str(e)}")
    
    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command"""
        try:
            # Mock status data (in production, would fetch from system)
            status_message = """
📊 *HTS System Status*

🟢 *System:* Online
🟢 *Primary APIs:* 38/40 Healthy
🟡 *Secondary APIs:* 2/40 Degraded
🟢 *Database:* Connected
🟢 *WebSocket:* 15 Connections

📈 *Trading Status:*
• Active Signals: 12
• Portfolio Value: $10,247.50
• Daily P&L: +$247.50 (+2.48%)
• Open Positions: 5

🕐 *Last Update:* {timestamp}
            """.format(timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"))
            
            await update.message.reply_text(
                status_message, 
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Error in status command: {str(e)}")
    
    async def portfolio_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /portfolio command"""
        try:
            # Mock portfolio data (in production, would fetch from portfolio manager)
            portfolio_message = """
💰 *Portfolio Summary*

💵 *Total Value:* $10,247.50
📈 *Total P&L:* +$247.50 (+2.48%)
📊 *Today's P&L:* +$125.30 (+1.23%)

🏆 *Positions (5):*
• BTC: +$150.25 (+3.2%)
• ETH: +$75.50 (+2.1%)
• ADA: -$25.75 (-1.8%)
• DOT: +$45.20 (+4.5%)
• LINK: +$2.30 (+0.1%)

📊 *Performance:*
• Win Rate: 68.5%
• Best Trade: +$287.50
• Worst Trade: -$145.20
• Sharpe Ratio: 1.85

🕐 *Last Update:* {timestamp}
            """.format(timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"))
            
            await update.message.reply_text(
                portfolio_message, 
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Error in portfolio command: {str(e)}")
    
    async def alerts_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /alerts command"""
        try:
            settings = self.alert_settings
            status_emoji = {True: "🟢", False: "🔴"}
            
            alerts_message = f"""
⚙️ *Alert Settings*

{status_emoji[settings['strong_signals']]} Strong Signals: {'Enabled' if settings['strong_signals'] else 'Disabled'}
{status_emoji[settings['portfolio_updates']]} Portfolio Updates: {'Enabled' if settings['portfolio_updates'] else 'Disabled'}
{status_emoji[settings['risk_alerts']]} Risk Alerts: {'Enabled' if settings['risk_alerts'] else 'Disabled'}
{status_emoji[settings['api_status']]} API Status: {'Enabled' if settings['api_status'] else 'Disabled'}
{status_emoji[settings['trade_confirmations']]} Trade Confirmations: {'Enabled' if settings['trade_confirmations'] else 'Disabled'}

To modify settings, contact the HTS team.
            """
            
            await update.message.reply_text(
                alerts_message, 
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Error in alerts command: {str(e)}")
    
    async def send_signal_alert(self, signal_data: Dict[str, Any]):
        """Send trading signal alert to subscribers"""
        try:
            if not self.bot or not self.subscribers or not self.alert_settings["strong_signals"]:
                return
            
            signal = signal_data.get("signal", "")
            symbol = signal_data.get("symbol", "")
            confidence = signal_data.get("confidence", 0)
            price = signal_data.get("price", 0)
            
            # Only send alerts for strong signals
            if confidence < 75:
                return
            
            signal_emoji = {
                "STRONG_BUY": "🚀",
                "BUY": "📈",
                "SELL": "📉",
                "STRONG_SELL": "💥"
            }
            
            emoji = signal_emoji.get(signal, "📊")
            
            alert_message = f"""
{emoji} *TRADING SIGNAL ALERT*

🪙 *Symbol:* {symbol}
📊 *Signal:* {signal}
🎯 *Confidence:* {confidence}%
💰 *Price:* ${price:,.2f}

⚡ *Components:*
• RSI/MACD: {signal_data.get('components', {}).get('rsi_macd', 0):.1f}
• Smart Money: {signal_data.get('components', {}).get('smc', 0):.1f}
• Pattern: {signal_data.get('components', {}).get('pattern', 0):.1f}

🕐 *Time:* {datetime.utcnow().strftime("%H:%M:%S UTC")}
            """
            
            # Send to all subscribers
            for chat_id in self.subscribers:
                try:
                    await self.bot.send_message(
                        chat_id=chat_id,
                        text=alert_message,
                        parse_mode='Markdown'
                    )
                except Exception as e:
                    logger.error(f"Failed to send alert to {chat_id}: {str(e)}")
            
            logger.info(f"Signal alert sent for {symbol}: {signal} ({confidence}%)")
            
        except Exception as e:
            logger.error(f"Error sending signal alert: {str(e)}")
    
    async def send_portfolio_update(self, portfolio_data: Dict[str, Any]):
        """Send portfolio update to subscribers"""
        try:
            if not self.bot or not self.subscribers or not self.alert_settings["portfolio_updates"]:
                return
            
            total_value = portfolio_data.get("total_value", 0)
            daily_pnl = portfolio_data.get("daily_pnl", 0)
            daily_pnl_pct = portfolio_data.get("daily_pnl_pct", 0)
            
            # Only send significant updates
            if abs(daily_pnl_pct) < 2.0:  # Less than 2% change
                return
            
            pnl_emoji = "📈" if daily_pnl > 0 else "📉"
            
            update_message = f"""
{pnl_emoji} *PORTFOLIO UPDATE*

💰 *Total Value:* ${total_value:,.2f}
📊 *Daily P&L:* {'+' if daily_pnl > 0 else ''}${daily_pnl:,.2f} ({daily_pnl_pct:+.2f}%)

🏆 *Positions:* {portfolio_data.get('position_count', 0)}
📈 *Win Rate:* {portfolio_data.get('win_rate', 0):.1f}%

🕐 *Time:* {datetime.utcnow().strftime("%H:%M:%S UTC")}
            """
            
            # Send to subscribers
            for chat_id in self.subscribers:
                try:
                    await self.bot.send_message(
                        chat_id=chat_id,
                        text=update_message,
                        parse_mode='Markdown'
                    )
                except Exception as e:
                    logger.error(f"Failed to send portfolio update to {chat_id}: {str(e)}")
            
            logger.info(f"Portfolio update sent: {daily_pnl_pct:+.2f}%")
            
        except Exception as e:
            logger.error(f"Error sending portfolio update: {str(e)}")
    
    async def send_risk_alert(self, risk_data: Dict[str, Any]):
        """Send risk alert to subscribers"""
        try:
            if not self.bot or not self.subscribers or not self.alert_settings["risk_alerts"]:
                return
            
            alert_type = risk_data.get("type", "")
            message = risk_data.get("message", "")
            severity = risk_data.get("severity", "medium")
            
            severity_emoji = {
                "low": "⚠️",
                "medium": "🚨",
                "high": "💥",
                "critical": "🔥"
            }
            
            emoji = severity_emoji.get(severity, "⚠️")
            
            risk_message = f"""
{emoji} *RISK ALERT*

🎯 *Type:* {alert_type}
📊 *Severity:* {severity.upper()}

💬 *Message:* {message}

🕐 *Time:* {datetime.utcnow().strftime("%H:%M:%S UTC")}
            """
            
            # Send to subscribers
            for chat_id in self.subscribers:
                try:
                    await self.bot.send_message(
                        chat_id=chat_id,
                        text=risk_message,
                        parse_mode='Markdown'
                    )
                except Exception as e:
                    logger.error(f"Failed to send risk alert to {chat_id}: {str(e)}")
            
            logger.info(f"Risk alert sent: {alert_type} ({severity})")
            
        except Exception as e:
            logger.error(f"Error sending risk alert: {str(e)}")
    
    async def send_trade_confirmation(self, trade_data: Dict[str, Any]):
        """Send trade confirmation to subscribers"""
        try:
            if not self.bot or not self.subscribers or not self.alert_settings["trade_confirmations"]:
                return
            
            symbol = trade_data.get("symbol", "")
            side = trade_data.get("side", "")
            quantity = trade_data.get("quantity", 0)
            price = trade_data.get("price", 0)
            pnl = trade_data.get("realized_pnl", 0)
            
            side_emoji = {"BUY": "🟢", "SELL": "🔴"}
            emoji = side_emoji.get(side, "📊")
            
            pnl_text = ""
            if pnl != 0:
                pnl_emoji = "💰" if pnl > 0 else "💸"
                pnl_text = f"\n{pnl_emoji} *P&L:* {'+' if pnl > 0 else ''}${pnl:,.2f}"
            
            trade_message = f"""
{emoji} *TRADE EXECUTED*

🪙 *Symbol:* {symbol}
📊 *Side:* {side}
🔢 *Quantity:* {quantity:,.4f}
💰 *Price:* ${price:,.2f}{pnl_text}

🕐 *Time:* {datetime.utcnow().strftime("%H:%M:%S UTC")}
            """
            
            # Send to subscribers
            for chat_id in self.subscribers:
                try:
                    await self.bot.send_message(
                        chat_id=chat_id,
                        text=trade_message,
                        parse_mode='Markdown'
                    )
                except Exception as e:
                    logger.error(f"Failed to send trade confirmation to {chat_id}: {str(e)}")
            
            logger.info(f"Trade confirmation sent: {symbol} {side}")
            
        except Exception as e:
            logger.error(f"Error sending trade confirmation: {str(e)}")
    
    async def send_api_status_alert(self, api_data: Dict[str, Any]):
        """Send API status alert to subscribers"""
        try:
            if not self.bot or not self.subscribers or not self.alert_settings["api_status"]:
                return
            
            healthy_count = sum(1 for api in api_data.values() if api.get("status") == "healthy")
            total_count = len(api_data)
            uptime_pct = healthy_count / total_count * 100 if total_count > 0 else 0
            
            # Only send if significant degradation
            if uptime_pct > 90:
                return
            
            status_emoji = "🟢" if uptime_pct > 75 else "🟡" if uptime_pct > 50 else "🔴"
            
            api_message = f"""
{status_emoji} *API STATUS ALERT*

📊 *System Health:* {uptime_pct:.1f}%
🟢 *Healthy APIs:* {healthy_count}/{total_count}

⚠️ *Degraded/Down APIs:*
            """
            
            # Add details for problematic APIs
            for api_name, api_info in api_data.items():
                if api_info.get("status") != "healthy":
                    status = api_info.get("status", "unknown")
                    api_message += f"\n• {api_name}: {status}"
            
            api_message += f"\n\n🕐 *Time:* {datetime.utcnow().strftime('%H:%M:%S UTC')}"
            
            # Send to subscribers
            for chat_id in self.subscribers:
                try:
                    await self.bot.send_message(
                        chat_id=chat_id,
                        text=api_message,
                        parse_mode='Markdown'
                    )
                except Exception as e:
                    logger.error(f"Failed to send API status alert to {chat_id}: {str(e)}")
            
            logger.info(f"API status alert sent: {uptime_pct:.1f}% health")
            
        except Exception as e:
            logger.error(f"Error sending API status alert: {str(e)}")
    
    async def start_bot(self):
        """Start the Telegram bot"""
        try:
            if self.application:
                await self.application.initialize()
                await self.application.start()
                logger.info("Telegram bot started")
            
        except Exception as e:
            logger.error(f"Error starting Telegram bot: {str(e)}")
    
    async def stop_bot(self):
        """Stop the Telegram bot"""
        try:
            if self.application:
                await self.application.stop()
                logger.info("Telegram bot stopped")
            
        except Exception as e:
            logger.error(f"Error stopping Telegram bot: {str(e)}")
    
    def add_subscriber(self, chat_id: str):
        """Add a subscriber manually"""
        if chat_id not in self.subscribers:
            self.subscribers.append(chat_id)
            logger.info(f"Added subscriber: {chat_id}")
    
    def remove_subscriber(self, chat_id: str):
        """Remove a subscriber manually"""
        if chat_id in self.subscribers:
            self.subscribers.remove(chat_id)
            logger.info(f"Removed subscriber: {chat_id}")
    
    def get_subscriber_count(self) -> int:
        """Get number of subscribers"""
        return len(self.subscribers)
    
    def update_alert_settings(self, settings: Dict[str, bool]):
        """Update alert settings"""
        self.alert_settings.update(settings)
        logger.info(f"Alert settings updated: {settings}")