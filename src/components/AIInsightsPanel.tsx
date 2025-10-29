import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Sparkles,
  BarChart3,
  FileText,
  Send,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

interface SentimentAnalysis {
  average_sentiment: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  confidence: number;
  timestamp: string;
}

interface TradingInsights {
  symbol: string;
  timestamp: string;
  technical_analysis: string;
  sentiment_analysis: SentimentAnalysis;
  recommendation: string;
  confidence_score: number;
  risk_assessment: string;
}

interface AIInsightsPanelProps {
  selectedSymbol: string;
  onSymbolChange?: (symbol: string) => void;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ selectedSymbol, onSymbolChange }) => {
  const [insights, setInsights] = useState<TradingInsights | null>(null);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'insights' | 'sentiment' | 'analysis' | 'chat'>('insights');

  useEffect(() => {
    if (selectedSymbol) {
      loadAIInsights();
    }
  }, [selectedSymbol]);

  const loadAIInsights = async () => {
    setIsLoading(true);
    try {
      // Load comprehensive insights
      const insightsData = await api.getAIInsights(selectedSymbol);
      setInsights(insightsData);

      // Load sentiment analysis
      const sentimentData = await api.getAISentiment(selectedSymbol);
      setSentiment(sentimentData);

    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMarketAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await api.generateMarketAnalysis(selectedSymbol, {
        symbol: selectedSymbol,
        price: 100,
        volume: 1000000,
        change_24h: 2.5
      });
      setMarketAnalysis(data.analysis);
    } catch (error) {
      console.error('Error generating market analysis:', error);
      setMarketAnalysis('Unable to generate market analysis at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const askAIQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    try {
      const context = `Current market data for ${selectedSymbol}: ${JSON.stringify(insights)}`;
      
      const data = await api.askAIQuestion(question, context);
      setAiResponse(data.answer);
    } catch (error) {
      console.error('Error asking AI question:', error);
      setAiResponse('Unable to process your question at this time.');
    } finally {
      setIsAsking(false);
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) return 'text-green-400';
    if (sentiment < -0.2) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.2) return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (sentiment < -0.2) return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <AlertCircle className="w-5 h-5 text-yellow-400" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const tabs: Array<{
    id: 'insights' | 'sentiment' | 'analysis' | 'chat';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'sentiment', label: 'Sentiment', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: FileText },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold">AI Market Intelligence</h2>
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </div>
        
        <button
          onClick={loadAIInsights}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          <span>Refresh AI Insights</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'insights' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {insights ? (
              <>
                {/* Trading Recommendation */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                      AI Recommendation
                    </h3>
                    <div className="text-sm text-gray-400">
                      Confidence: {(insights.confidence_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-lg font-medium text-blue-400 mb-2">
                    {insights.recommendation}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Risk Assessment:</span>
                      <span className={`font-bold ${getRiskColor(insights.risk_assessment)}`}>
                        {insights.risk_assessment}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      Updated: {new Date(insights.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Technical Analysis */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                    Technical Analysis
                  </h3>
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {insights.technical_analysis}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  {isLoading ? 'Loading AI insights...' : 'No insights available. Click refresh to load.'}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'sentiment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {sentiment ? (
              <>
                {/* Sentiment Overview */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Market Sentiment</h3>
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(sentiment.average_sentiment)}
                      <span className={`font-bold ${getSentimentColor(sentiment.average_sentiment)}`}>
                        {sentiment.average_sentiment > 0 ? 'Positive' : 
                         sentiment.average_sentiment < 0 ? 'Negative' : 'Neutral'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {sentiment.sentiment_distribution.positive}
                      </div>
                      <div className="text-sm text-gray-400">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-400">
                        {sentiment.sentiment_distribution.neutral}
                      </div>
                      <div className="text-sm text-gray-400">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {sentiment.sentiment_distribution.negative}
                      </div>
                      <div className="text-sm text-gray-400">Negative</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Confidence Score</span>
                      <span>{(sentiment.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${sentiment.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No sentiment data available.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'analysis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-400" />
                  AI Market Analysis
                </h3>
                <button
                  onClick={generateMarketAnalysis}
                  disabled={isLoading}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center space-x-1 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>Generate</span>
                </button>
              </div>
              
              <div className="text-gray-300 whitespace-pre-wrap min-h-[200px]">
                {marketAnalysis || 'Click "Generate" to create AI-powered market analysis...'}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                Ask AI Assistant
              </h3>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    id="ai-question"
                    name="ai-question"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask about market conditions, trends, or trading advice..."
                    className="flex-1 bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && askAIQuestion()}
                  />
                  <button
                    onClick={askAIQuestion}
                    disabled={isAsking || !question.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isAsking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {aiResponse && (
                  <div className="bg-gray-600/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">AI Assistant</span>
                    </div>
                    <div className="text-gray-300">{aiResponse}</div>
                  </div>
                )}
              </div>
              
              {/* Suggested Questions */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Suggested Questions:</h4>
                <div className="space-y-1">
                  {[
                    `What's the outlook for ${selectedSymbol}?`,
                    `Should I buy or sell ${selectedSymbol} now?`,
                    `What are the key risk factors for ${selectedSymbol}?`,
                    `What technical levels should I watch?`
                  ].map((suggestedQ, index) => (
                    <button
                      key={index}
                      onClick={() => setQuestion(suggestedQ)}
                      className="text-xs text-blue-400 hover:text-blue-300 block"
                    >
                      {suggestedQ}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInsightsPanel;