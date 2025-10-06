/**
 * HTS Trading System - Telegram Service
 * Frontend integration with Telegram notifications
 */

import { apiClient } from './api';
import toast from 'react-hot-toast';

export interface TelegramConfig {
  botToken?: string;
  chatId?: string;
  enabled: boolean;
}

export interface NotificationSettings {
  strong_signals: boolean;
  portfolio_updates: boolean;
  risk_alerts: boolean;
  api_status: boolean;
  trade_confirmations: boolean;
}

class TelegramService {
  private config: TelegramConfig = {
    enabled: false
  };

  private settings: NotificationSettings = {
    strong_signals: true,
    portfolio_updates: true,
    risk_alerts: true,
    api_status: false,
    trade_confirmations: true
  };

  constructor() {
    this.loadConfig();
    this.loadSettings();
  }

  // Configuration Management
  private loadConfig(): void {
    const stored = localStorage.getItem('telegram_config');
    if (stored) {
      try {
        this.config = { ...this.config, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to load Telegram config:', error);
      }
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('telegram_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save Telegram config:', error);
    }
  }

  private loadSettings(): void {
    const stored = localStorage.getItem('notification_settings');
    if (stored) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  // Public API
  getConfig(): TelegramConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<TelegramConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.botToken && !!this.config.chatId;
  }

  // Telegram Bot Integration
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled()) {
      toast.error('Telegram not configured');
      return false;
    }

    try {
      const response = await this.sendMessage('🧪 HTS Trading System - Connection Test');
      if (response) {
        toast.success('Telegram connection successful!');
        return true;
      } else {
        toast.error('Failed to send test message');
        return false;
      }
    } catch (error) {
      console.error('Telegram connection test failed:', error);
      toast.error('Telegram connection test failed');
      return false;
    }
  }

  private async sendMessage(message: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  // Notification Handlers
  async notifySignalAlert(signal: any): Promise<void> {
    if (!this.settings.strong_signals || !this.isEnabled()) {
      return;
    }

    const emoji = this.getSignalEmoji(signal.signal);
    const message = `
${emoji} *TRADING SIGNAL ALERT*

🪙 *Symbol:* ${signal.symbol}
📊 *Signal:* ${signal.signal}
🎯 *Confidence:* ${signal.confidence}%
💰 *Price:* $${signal.price.toFixed(2)}

⚡ *Components:*
• RSI/MACD: ${signal.components?.rsi_macd?.toFixed(1) || 'N/A'}
• Smart Money: ${signal.components?.smc?.toFixed(1) || 'N/A'}
• Pattern: ${signal.components?.pattern?.toFixed(1) || 'N/A'}

🕐 *Time:* ${new Date().toLocaleTimeString()} UTC
    `.trim();

    await this.sendMessage(message);
  }

  async notifyPortfolioUpdate(portfolio: any): Promise<void> {
    if (!this.settings.portfolio_updates || !this.isEnabled()) {
      return;
    }

    const pnlEmoji = portfolio.daily_pnl > 0 ? '📈' : '📉';
    const message = `
${pnlEmoji} *PORTFOLIO UPDATE*

💰 *Total Value:* $${portfolio.total_value.toFixed(2)}
📊 *Daily P&L:* ${portfolio.daily_pnl >= 0 ? '+' : ''}$${portfolio.daily_pnl.toFixed(2)} (${portfolio.daily_pnl_pct.toFixed(2)}%)

🏆 *Positions:* ${portfolio.position_count}
📈 *Win Rate:* ${portfolio.win_rate.toFixed(1)}%

🕐 *Time:* ${new Date().toLocaleTimeString()} UTC
    `.trim();

    await this.sendMessage(message);
  }

  async notifyRiskAlert(riskData: any): Promise<void> {
    if (!this.settings.risk_alerts || !this.isEnabled()) {
      return;
    }

    const severityEmoji = this.getSeverityEmoji(riskData.severity);
    const message = `
${severityEmoji} *RISK ALERT*

🎯 *Type:* ${riskData.type}
📊 *Severity:* ${riskData.severity.toUpperCase()}

💬 *Message:* ${riskData.message}

🕐 *Time:* ${new Date().toLocaleTimeString()} UTC
    `.trim();

    await this.sendMessage(message);
  }

  async notifyTradeExecution(trade: any): Promise<void> {
    if (!this.settings.trade_confirmations || !this.isEnabled()) {
      return;
    }

    const sideEmoji = trade.side === 'BUY' ? '🟢' : '🔴';
    const pnlText = trade.pnl ? `\n💰 *P&L:* ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '';

    const message = `
${sideEmoji} *TRADE EXECUTED*

🪙 *Symbol:* ${trade.symbol}
📊 *Side:* ${trade.side}
🔢 *Quantity:* ${trade.quantity}
💰 *Price:* $${trade.price.toFixed(2)}${pnlText}

🕐 *Time:* ${new Date().toLocaleTimeString()} UTC
    `.trim();

    await this.sendMessage(message);
  }

  async notifyAPIStatus(apiData: any): Promise<void> {
    if (!this.settings.api_status || !this.isEnabled()) {
      return;
    }

    const healthyCount = Object.values(apiData).filter((api: any) => api.status === 'healthy').length;
    const totalCount = Object.keys(apiData).length;
    const uptimePercentage = (healthyCount / totalCount) * 100;

    // Only notify if significant degradation
    if (uptimePercentage > 90) {
      return;
    }

    const statusEmoji = uptimePercentage > 75 ? '🟡' : '🔴';
    const message = `
${statusEmoji} *API STATUS ALERT*

📊 *System Health:* ${uptimePercentage.toFixed(1)}%
🟢 *Healthy APIs:* ${healthyCount}/${totalCount}

⚠️ *Issues Detected*

🕐 *Time:* ${new Date().toLocaleTimeString()} UTC
    `.trim();

    await this.sendMessage(message);
  }

  // Utility Methods
  private getSignalEmoji(signal: string): string {
    switch (signal) {
      case 'STRONG_BUY':
        return '🚀';
      case 'BUY':
        return '📈';
      case 'HOLD':
        return '📊';
      case 'SELL':
        return '📉';
      case 'STRONG_SELL':
        return '💥';
      default:
        return '📊';
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'low':
        return '⚠️';
      case 'medium':
        return '🚨';
      case 'high':
        return '💥';
      case 'critical':
        return '🔥';
      default:
        return '⚠️';
    }
  }

  // Setup Wizard
  async setupWizard(): Promise<boolean> {
    return new Promise((resolve) => {
      // This would typically open a modal or navigate to a setup page
      // For now, we'll just show instructions
      const instructions = `
🤖 **Telegram Bot Setup Instructions**

1. **Create a Bot:**
   - Message @BotFather on Telegram
   - Send /newbot and follow instructions
   - Copy the bot token

2. **Get Chat ID:**
   - Message your bot
   - Visit: https://api.telegram.org/bot<TOKEN>/getUpdates
   - Find your chat ID in the response

3. **Configure HTS:**
   - Enter bot token and chat ID in settings
   - Test the connection
   - Enable desired notifications

4. **Subscribe:**
   - Send /start to your bot
   - Send /subscribe to enable notifications
      `;

      toast(instructions, {
        duration: 10000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          maxWidth: '500px'
        }
      });

      resolve(true);
    });
  }

  // Import/Export Settings
  exportSettings(): string {
    return JSON.stringify({
      config: this.config,
      settings: this.settings
    }, null, 2);
  }

  importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson);
      
      if (imported.config) {
        this.updateConfig(imported.config);
      }
      
      if (imported.settings) {
        this.updateSettings(imported.settings);
      }

      toast.success('Settings imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      toast.error('Failed to import settings');
      return false;
    }
  }

  // Analytics
  getNotificationStats(): any {
    // In a real implementation, this would track notification statistics
    return {
      total_sent: 0,
      success_rate: 100,
      last_notification: null,
      enabled_types: Object.entries(this.settings)
        .filter(([_, enabled]) => enabled)
        .map(([type, _]) => type)
    };
  }
}

// Export singleton instance
export const telegramService = new TelegramService();

// Export types and service
export default telegramService;