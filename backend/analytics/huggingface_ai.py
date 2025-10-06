import os
import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import pandas as pd
import numpy as np
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from huggingface_hub import InferenceClient
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class HuggingFaceAI:
    def __init__(self):
        self.api_key = os.getenv('HUGGINGFACE_API_KEY')
        if not self.api_key:
            raise ValueError("HUGGINGFACE_API_KEY not found in environment variables")
        
        self.client = InferenceClient(token=self.api_key)
        self.base_url = "https://api-inference.huggingface.co/models"
        
        # Initialize local models for faster inference
        self.sentiment_analyzer = None
        self.text_generator = None
        self.embeddings_model = None
        
        # Model configurations
        self.models = {
            'sentiment': 'cardiffnlp/twitter-roberta-base-sentiment-latest',
            'financial_sentiment': 'ProsusAI/finbert',
            'text_generation': 'microsoft/DialoGPT-large',
            'market_analysis': 'EleutherAI/gpt-neo-1.3B',
            'embeddings': 'sentence-transformers/all-MiniLM-L6-v2',
            'summarization': 'facebook/bart-large-cnn',
            'question_answering': 'deepset/roberta-base-squad2'
        }
        
        # Cache for model responses
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
        
    async def initialize_models(self):
        """Initialize local models for better performance"""
        try:
            # Load sentiment analysis model
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model=self.models['financial_sentiment'],
                tokenizer=self.models['financial_sentiment']
            )
            
            logger.info("Hugging Face models initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            # Fallback to API-only mode
            self.sentiment_analyzer = None
    
    async def analyze_market_sentiment(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze sentiment of market-related texts"""
        try:
            if self.sentiment_analyzer:
                # Use local model for faster inference
                results = self.sentiment_analyzer(texts)
            else:
                # Use API inference
                results = await self._api_inference(self.models['financial_sentiment'], texts)
            
            # Process results
            sentiment_scores = []
            sentiment_labels = []
            
            for result in results:
                if isinstance(result, dict):
                    label = result.get('label', 'NEUTRAL')
                    score = result.get('score', 0.5)
                else:
                    label = 'NEUTRAL'
                    score = 0.5
                
                # Normalize labels
                if label in ['POSITIVE', 'positive']:
                    sentiment_labels.append('positive')
                    sentiment_scores.append(score)
                elif label in ['NEGATIVE', 'negative']:
                    sentiment_labels.append('negative')
                    sentiment_scores.append(-score)
                else:
                    sentiment_labels.append('neutral')
                    sentiment_scores.append(0.0)
            
            # Calculate aggregate sentiment
            avg_sentiment = np.mean(sentiment_scores) if sentiment_scores else 0.0
            sentiment_distribution = {
                'positive': sentiment_labels.count('positive'),
                'negative': sentiment_labels.count('negative'),
                'neutral': sentiment_labels.count('neutral')
            }
            
            return {
                'average_sentiment': float(avg_sentiment),
                'sentiment_distribution': sentiment_distribution,
                'individual_scores': sentiment_scores,
                'individual_labels': sentiment_labels,
                'confidence': float(np.mean([abs(score) for score in sentiment_scores])) if sentiment_scores else 0.0,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return {
                'average_sentiment': 0.0,
                'sentiment_distribution': {'positive': 0, 'negative': 0, 'neutral': len(texts)},
                'individual_scores': [0.0] * len(texts),
                'individual_labels': ['neutral'] * len(texts),
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    async def generate_market_analysis(self, market_data: Dict[str, Any]) -> str:
        """Generate AI-powered market analysis"""
        try:
            # Create market context prompt
            prompt = self._create_market_analysis_prompt(market_data)
            
            # Generate analysis using text generation model
            response = await self._api_inference(
                self.models['market_analysis'],
                prompt,
                parameters={
                    "max_new_tokens": 500,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "do_sample": True
                }
            )
            
            if isinstance(response, list) and len(response) > 0:
                generated_text = response[0].get('generated_text', '')
                # Extract only the generated part (remove prompt)
                analysis = generated_text.replace(prompt, '').strip()
            else:
                analysis = "Unable to generate market analysis at this time."
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error generating market analysis: {e}")
            return f"Market analysis unavailable: {str(e)}"
    
    async def summarize_news(self, news_texts: List[str]) -> List[str]:
        """Summarize financial news articles"""
        try:
            summaries = []
            
            for text in news_texts:
                # Truncate text if too long
                if len(text) > 1000:
                    text = text[:1000] + "..."
                
                response = await self._api_inference(
                    self.models['summarization'],
                    text,
                    parameters={
                        "max_length": 150,
                        "min_length": 30,
                        "do_sample": False
                    }
                )
                
                if isinstance(response, list) and len(response) > 0:
                    summary = response[0].get('summary_text', text[:100] + "...")
                else:
                    summary = text[:100] + "..."
                
                summaries.append(summary)
            
            return summaries
            
        except Exception as e:
            logger.error(f"Error summarizing news: {e}")
            return [text[:100] + "..." for text in news_texts]
    
    async def answer_market_question(self, question: str, context: str) -> str:
        """Answer questions about market data using AI"""
        try:
            payload = {
                "question": question,
                "context": context
            }
            
            response = await self._api_inference(
                self.models['question_answering'],
                payload
            )
            
            if isinstance(response, dict):
                answer = response.get('answer', 'Unable to answer the question.')
                confidence = response.get('score', 0.0)
                
                if confidence < 0.3:
                    return "I'm not confident enough to answer this question based on the provided context."
                
                return answer
            else:
                return "Unable to process the question at this time."
                
        except Exception as e:
            logger.error(f"Error answering question: {e}")
            return f"Error processing question: {str(e)}"
    
    async def generate_trading_insights(self, symbol: str, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive trading insights for a symbol"""
        try:
            # Prepare data for analysis
            price = market_data.get('price', 0)
            volume = market_data.get('volume', 0)
            change_24h = market_data.get('change_24h', 0)
            volatility = market_data.get('volatility', 0)
            
            # Generate technical analysis prompt
            technical_prompt = f"""
            Analyze the following market data for {symbol}:
            - Current Price: ${price:.2f}
            - 24h Change: {change_24h:.2f}%
            - Volume: {volume:,.0f}
            - Volatility: {volatility:.4f}
            
            Provide a technical analysis including:
            1. Price trend assessment
            2. Volume analysis
            3. Volatility interpretation
            4. Key support/resistance levels
            5. Trading recommendations
            """
            
            # Generate market sentiment analysis
            news_texts = await self._fetch_recent_news(symbol)
            sentiment_analysis = await self.analyze_market_sentiment(news_texts)
            
            # Generate technical analysis
            technical_analysis = await self.generate_market_analysis({
                'symbol': symbol,
                'price': price,
                'volume': volume,
                'change_24h': change_24h,
                'volatility': volatility
            })
            
            # Generate trading recommendation
            recommendation = await self._generate_trading_recommendation(
                symbol, market_data, sentiment_analysis, technical_analysis
            )
            
            return {
                'symbol': symbol,
                'timestamp': datetime.now().isoformat(),
                'technical_analysis': technical_analysis,
                'sentiment_analysis': sentiment_analysis,
                'recommendation': recommendation,
                'confidence_score': self._calculate_confidence_score(sentiment_analysis, market_data),
                'risk_assessment': self._assess_risk(market_data, sentiment_analysis)
            }
            
        except Exception as e:
            logger.error(f"Error generating trading insights for {symbol}: {e}")
            return {
                'symbol': symbol,
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'technical_analysis': 'Analysis unavailable',
                'sentiment_analysis': {'average_sentiment': 0.0, 'confidence': 0.0},
                'recommendation': 'No recommendation available',
                'confidence_score': 0.0,
                'risk_assessment': 'Unknown'
            }
    
    async def _api_inference(self, model: str, inputs: Any, parameters: Optional[Dict] = None) -> Any:
        """Make API call to Hugging Face Inference API"""
        cache_key = f"{model}_{hash(str(inputs))}"
        
        # Check cache
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if datetime.now().timestamp() - timestamp < self.cache_ttl:
                return cached_result
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {"inputs": inputs}
        if parameters:
            payload["parameters"] = parameters
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/{model}",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        # Cache the result
                        self.cache[cache_key] = (result, datetime.now().timestamp())
                        return result
                    else:
                        error_text = await response.text()
                        logger.error(f"API error {response.status}: {error_text}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error making API request: {e}")
            return None
    
    def _create_market_analysis_prompt(self, market_data: Dict[str, Any]) -> str:
        """Create a structured prompt for market analysis"""
        symbol = market_data.get('symbol', 'UNKNOWN')
        price = market_data.get('price', 0)
        volume = market_data.get('volume', 0)
        change_24h = market_data.get('change_24h', 0)
        
        return f"""
        Market Analysis for {symbol}:
        Current Price: ${price:.2f}
        24h Change: {change_24h:.2f}%
        Volume: {volume:,.0f}
        
        Based on this data, provide a comprehensive market analysis including:
        - Technical outlook
        - Price momentum
        - Volume analysis
        - Key levels to watch
        
        Analysis:
        """
    
    async def _fetch_recent_news(self, symbol: str) -> List[str]:
        """Fetch recent news for sentiment analysis (mock implementation)"""
        # In a real implementation, this would fetch from news APIs
        mock_news = [
            f"{symbol} shows strong performance amid market volatility",
            f"Analysts upgrade {symbol} price target following earnings",
            f"Market uncertainty affects {symbol} trading volume",
            f"{symbol} technical indicators suggest potential breakout",
            f"Institutional investors increase {symbol} holdings"
        ]
        return mock_news
    
    async def _generate_trading_recommendation(self, symbol: str, market_data: Dict, sentiment: Dict, technical: str) -> str:
        """Generate trading recommendation based on analysis"""
        try:
            change_24h = market_data.get('change_24h', 0)
            volatility = market_data.get('volatility', 0)
            sentiment_score = sentiment.get('average_sentiment', 0)
            
            # Simple recommendation logic
            if sentiment_score > 0.3 and change_24h > 2:
                return "BUY - Strong positive sentiment and upward momentum"
            elif sentiment_score < -0.3 and change_24h < -2:
                return "SELL - Negative sentiment and downward pressure"
            elif volatility > 0.05:
                return "HOLD - High volatility, wait for stability"
            else:
                return "NEUTRAL - Mixed signals, monitor closely"
                
        except Exception as e:
            return f"Unable to generate recommendation: {str(e)}"
    
    def _calculate_confidence_score(self, sentiment: Dict, market_data: Dict) -> float:
        """Calculate overall confidence score for the analysis"""
        try:
            sentiment_confidence = sentiment.get('confidence', 0)
            volume = market_data.get('volume', 0)
            
            # Higher volume and sentiment confidence = higher overall confidence
            volume_factor = min(volume / 1000000, 1.0)  # Normalize volume
            
            return float((sentiment_confidence + volume_factor) / 2)
            
        except Exception:
            return 0.5
    
    def _assess_risk(self, market_data: Dict, sentiment: Dict) -> str:
        """Assess risk level based on market data and sentiment"""
        try:
            volatility = market_data.get('volatility', 0)
            sentiment_score = abs(sentiment.get('average_sentiment', 0))
            
            if volatility > 0.05 or sentiment_score < 0.2:
                return "HIGH"
            elif volatility > 0.03 or sentiment_score < 0.4:
                return "MEDIUM"
            else:
                return "LOW"
                
        except Exception:
            return "UNKNOWN"

# Global instance
huggingface_ai = HuggingFaceAI()