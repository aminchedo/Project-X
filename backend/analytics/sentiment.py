import requests
import asyncio
from datetime import datetime

class SentimentAnalyzer:
    def __init__(self):
        self.fear_greed_url = "https://api.alternative.me/fng/"
        self.coinmarketcap_key = "b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c"
        self.cryptocompare_key = "e79c8e6d4c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f"
    
    async def get_fear_greed_index(self) -> dict:
        """Get Fear & Greed Index from Alternative.me"""
        try:
            response = requests.get(f"{self.fear_greed_url}?limit=1&format=json", timeout=5)
            data = response.json()
            
            if 'data' in data and len(data['data']) > 0:
                latest = data['data'][0]
                value = int(latest['value'])
                classification = latest['value_classification']
                
                return {
                    'value': value,
                    'classification': classification,
                    'signal': self._classify_sentiment(value)
                }
        except Exception as e:
            print(f"Error fetching Fear & Greed Index: {e}")
        
        return {
            'value': 50,
            'classification': 'Neutral',
            'signal': 'NEUTRAL'
        }
    
    async def get_coinmarketcap_sentiment(self, symbol: str) -> dict:
        """Get market data from CoinMarketCap for sentiment analysis"""
        try:
            url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
            headers = {
                'X-CMC_PRO_API_KEY': self.coinmarketcap_key
            }
            params = {
                'symbol': symbol.replace('USDT', ''),
                'convert': 'USD'
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=5)
            data = response.json()
            
            if 'data' in data:
                coin_symbol = symbol.replace('USDT', '')
                if coin_symbol in data['data']:
                    coin_data = data['data'][coin_symbol]
                    quote = coin_data['quote']['USD']
                    
                    return {
                        'market_cap_rank': coin_data.get('cmc_rank', 0),
                        'volume_24h': quote.get('volume_24h', 0),
                        'percent_change_24h': quote.get('percent_change_24h', 0),
                        'market_cap': quote.get('market_cap', 0)
                    }
        except Exception as e:
            print(f"Error fetching CoinMarketCap data: {e}")
        
        return None
    
    async def get_social_sentiment(self, symbol: str) -> dict:
        """Get social sentiment data"""
        try:
            # Reddit sentiment (simplified)
            reddit_url = f"https://www.reddit.com/r/CryptoCurrency/search.json?q={symbol}&sort=new&limit=10"
            response = requests.get(reddit_url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                posts = data.get('data', {}).get('children', [])
                
                return {
                    'reddit_mentions': len(posts),
                    'social_activity': min(len(posts) / 10, 1.0)
                }
        except Exception as e:
            print(f"Error fetching social sentiment: {e}")
        
        return {
            'reddit_mentions': 0,
            'social_activity': 0.5
        }
    
    def _classify_sentiment(self, value: int) -> str:
        """Classify sentiment based on Fear & Greed value"""
        if value <= 20:
            return 'EXTREMELY_FEARFUL'
        elif value <= 40:
            return 'FEARFUL'
        elif value <= 60:
            return 'NEUTRAL'
        elif value <= 80:
            return 'GREEDY'
        else:
            return 'EXTREMELY_GREEDY'
    
    async def analyze_market_sentiment(self, symbol: str = 'BTC') -> dict:
        """Comprehensive sentiment analysis (10% weight in final algorithm)"""
        fear_greed = await self.get_fear_greed_index()
        cmc_data = await self.get_coinmarketcap_sentiment(symbol)
        social_data = await self.get_social_sentiment(symbol)
        
        # Calculate sentiment score components
        fear_greed_score = self._calculate_fear_greed_score(fear_greed['value'])
        volume_score = self._calculate_volume_score(cmc_data)
        social_score = self._calculate_social_score(social_data)
        
        # Weighted sentiment score
        sentiment_score = (
            0.5 * fear_greed_score +
            0.3 * volume_score +
            0.2 * social_score
        )
        
        return {
            'score': max(0, min(1, sentiment_score)),
            'fear_greed': fear_greed,
            'market_data': cmc_data,
            'social_data': social_data,
            'signal': self._get_trading_signal(sentiment_score),
            'timestamp': datetime.now()
        }
    
    def _calculate_fear_greed_score(self, value: int) -> float:
        """Calculate score from Fear & Greed Index"""
        # Extreme fear (0-25) = opportunity (high score)
        if value <= 25:
            return 0.8
        # Fear (26-45) = somewhat bullish
        elif value <= 45:
            return 0.65
        # Neutral (46-55)
        elif value <= 55:
            return 0.5
        # Greed (56-75) = caution
        elif value <= 75:
            return 0.35
        # Extreme greed (76-100) = sell signal
        else:
            return 0.2
    
    def _calculate_volume_score(self, market_data: dict) -> float:
        """Calculate score from volume and price change data"""
        if not market_data:
            return 0.5
        
        change_abs = abs(market_data.get('percent_change_24h', 0))
        volume_score = min(change_abs / 10, 1)  # Normalize to 0-1
        
        return volume_score
    
    def _calculate_social_score(self, social_data: dict) -> float:
        """Calculate score from social media activity"""
        if not social_data:
            return 0.5
        
        return social_data.get('social_activity', 0.5)
    
    def _get_trading_signal(self, score: float) -> str:
        """Convert sentiment score to trading signal"""
        if score > 0.6:
            return 'BUY'
        elif score < 0.4:
            return 'SELL'
        else:
            return 'HOLD'