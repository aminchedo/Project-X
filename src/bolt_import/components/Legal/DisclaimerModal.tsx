import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, FileText, CheckCircle, XCircle } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept: () => void;
  onReject: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept, onReject }) => {
  const [accepted, setAccepted] = useState(false);
  const [readTime, setReadTime] = useState(0);
  const [requiredReadTime] = useState(30); // 30 seconds minimum read time
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setReadTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAccept = () => {
    if (accepted && readTime >= requiredReadTime) {
      // Store acceptance in localStorage
      localStorage.setItem('disclaimerAccepted', 'true');
      localStorage.setItem('disclaimerDate', new Date().toISOString());
      localStorage.setItem('disclaimerVersion', '1.0');
      onAccept();
    }
  };

  const canAccept = accepted && readTime >= requiredReadTime;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">IMPORTANT LEGAL DISCLAIMER</h2>
              <p className="text-red-100">Please read carefully before proceeding</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  ⚠️ THIS SOFTWARE IS NOT FINANCIAL ADVICE
                </h3>
                <p className="text-red-700">
                  This application is provided for educational and informational purposes only. 
                  It is not intended as financial, investment, or trading advice.
                </p>
              </div>
            </div>
          </div>

          {/* Key Disclaimers */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-blue-600" />
              Key Disclaimers
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">🚨 High Risk Warning</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Cryptocurrency trading involves substantial risk of loss</li>
                  <li>• You may lose more than your initial investment</li>
                  <li>• Past performance does not guarantee future results</li>
                  <li>• Markets can be highly volatile and unpredictable</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🤖 AI Limitations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• AI predictions are probabilistic and may be incorrect</li>
                  <li>• Models are trained on historical data</li>
                  <li>• Market conditions can change rapidly</li>
                  <li>• No AI system can predict market movements with certainty</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">⚖️ Legal Responsibility</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• You are solely responsible for your trading decisions</li>
                  <li>• We are not liable for any financial losses</li>
                  <li>• Consult a licensed financial advisor before trading</li>
                  <li>• Ensure compliance with local regulations</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">📚 Educational Purpose</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Use this tool for learning and analysis</li>
                  <li>• Understand the risks before trading</li>
                  <li>• Start with paper trading or small amounts</li>
                  <li>• Never invest more than you can afford to lose</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed Terms */}
          {showDetails && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-gray-600" />
                Detailed Terms and Conditions
              </h3>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <h4 className="font-semibold text-gray-800">1. Software License</h4>
                    <p>This software is provided "as is" without warranty of any kind. We disclaim all warranties, express or implied, including but not limited to the implied warranties of merchantability and fitness for a particular purpose.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800">2. No Investment Advice</h4>
                    <p>Nothing in this software constitutes investment advice, financial advice, trading advice, or any other type of advice. All information is for educational purposes only.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800">3. Risk Disclosure</h4>
                    <p>Cryptocurrency trading carries significant risk. Prices can fluctuate widely and you may lose some or all of your investment. Never trade with money you cannot afford to lose.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800">4. Limitation of Liability</h4>
                    <p>In no event shall the developers be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of this software.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800">5. Regulatory Compliance</h4>
                    <p>You are responsible for ensuring compliance with all applicable laws and regulations in your jurisdiction. Cryptocurrency regulations vary by country and region.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800">6. Data and Privacy</h4>
                    <p>We collect minimal data necessary for software functionality. All data is encrypted and stored securely. We do not sell or share your personal information.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Read Time Progress */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Minimum reading time required</span>
              <span className="text-sm text-gray-500">
                {readTime}s / {requiredReadTime}s
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((readTime / requiredReadTime) * 100, 100)}%` }}
              />
            </div>
            {readTime < requiredReadTime && (
              <p className="text-xs text-gray-500 mt-1">
                Please read for at least {requiredReadTime} seconds before accepting
              </p>
            )}
          </div>

          {/* Acceptance Checkbox */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="accept-disclaimer"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="accept-disclaimer" className="text-sm text-gray-700">
              <span className="font-medium">I have read, understood, and agree to the terms and conditions above.</span>
              <br />
              <span className="text-gray-500">
                I acknowledge that this software is for educational purposes only and I am solely responsible for any trading decisions.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showDetails ? 'Hide' : 'Show'} Detailed Terms
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onReject}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <XCircle className="h-5 w-5" />
                <span>Decline & Exit</span>
              </button>
              
              <button
                onClick={handleAccept}
                disabled={!canAccept}
                className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                  canAccept
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="h-5 w-5" />
                <span>I Accept & Continue</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
            <p>
              By accepting these terms, you acknowledge that you have read and understood all disclaimers and agree to use this software responsibly.
            </p>
            <p className="mt-1">
              Last updated: {new Date().toLocaleDateString()} | Version 1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
