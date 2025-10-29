import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  FileText, 
  Scale, 
  Eye, 
  Lock, 
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const DisclaimersPage: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const sections = [
    {
      id: 'general',
      title: 'General Disclaimer',
      icon: <AlertTriangle className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Not Financial Advice</h4>
            <p className="text-red-700 text-sm">
              This software is provided for educational and informational purposes only. 
              It is not intended as financial, investment, or trading advice. Any information 
              provided should not be considered as a recommendation to buy, sell, or hold any 
              cryptocurrency or other financial instrument.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Key Points:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span>This software is for educational purposes only</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span>No guarantee of accuracy or completeness of information</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Past performance does not guarantee future results</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span>You are solely responsible for your trading decisions</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'risk',
      title: 'Risk Disclosure',
      icon: <Shield className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">🚨 High Risk Warning</h4>
            <p className="text-orange-700 text-sm">
              Cryptocurrency trading involves substantial risk of loss and is not suitable 
              for all investors. The high degree of leverage can work against you as well as for you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Market Risks:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Extreme price volatility</li>
                <li>• 24/7 market operation</li>
                <li>• Regulatory uncertainty</li>
                <li>• Technology risks</li>
                <li>• Liquidity risks</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Trading Risks:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Potential for significant losses</li>
                <li>• Margin requirements</li>
                <li>• Slippage and execution delays</li>
                <li>• Counterparty risks</li>
                <li>• System failures</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai',
      title: 'AI System Limitations',
      icon: <FileText className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">🤖 AI Predictions Disclaimer</h4>
            <p className="text-blue-700 text-sm">
              The AI predictions provided by this software are probabilistic in nature and 
              should not be relied upon as the sole basis for trading decisions. AI systems 
              have inherent limitations and may produce incorrect or misleading results.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">AI Limitations:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Predictions are based on historical data patterns</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Market conditions can change rapidly</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>No AI system can predict market movements with certainty</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Models may not account for all market factors</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Backtesting results may not reflect future performance</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'legal',
      title: 'Legal Terms',
      icon: <Scale className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">⚖️ Legal Terms and Conditions</h4>
            <p className="text-purple-700 text-sm">
              By using this software, you agree to the following terms and conditions. 
              Please read them carefully before proceeding.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">1. Software License</h4>
              <p className="text-sm text-gray-700">
                This software is provided "as is" without warranty of any kind. We disclaim all 
                warranties, express or implied, including but not limited to the implied warranties 
                of merchantability and fitness for a particular purpose.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">2. Limitation of Liability</h4>
              <p className="text-sm text-gray-700">
                In no event shall the developers be liable for any direct, indirect, incidental, 
                special, consequential, or punitive damages arising out of or relating to your 
                use of this software.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">3. Regulatory Compliance</h4>
              <p className="text-sm text-gray-700">
                You are responsible for ensuring compliance with all applicable laws and 
                regulations in your jurisdiction. Cryptocurrency regulations vary by country 
                and region.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">4. Data and Privacy</h4>
              <p className="text-sm text-gray-700">
                We collect minimal data necessary for software functionality. All data is 
                encrypted and stored securely. We do not sell or share your personal information.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: <Eye className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🔒 Privacy and Data Protection</h4>
            <p className="text-green-700 text-sm">
              We are committed to protecting your privacy and ensuring the security of your 
              personal information. This section outlines how we collect, use, and protect your data.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Data Collection:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Minimal data collection for software functionality</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span>No personal information sold or shared</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span>All data encrypted and stored securely</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Right to data deletion and portability</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'compliance',
      title: 'Regulatory Compliance',
      icon: <Globe className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-800 mb-2">🌍 Regulatory Compliance</h4>
            <p className="text-indigo-700 text-sm">
              Cryptocurrency regulations vary by jurisdiction. It is your responsibility 
              to ensure compliance with all applicable laws and regulations in your area.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Important Notes:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Regulations are constantly evolving</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Some jurisdictions may restrict cryptocurrency trading</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Tax implications may apply to trading activities</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Consult with legal and tax professionals</span>
              </li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Legal Disclaimers</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Important legal information and disclaimers regarding the use of this software. 
          Please read carefully before using any features.
        </p>
      </div>

      {/* Disclaimer Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <div key={section.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600">
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="pt-4">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Version:</strong> 1.0
          </p>
          <p className="text-xs text-gray-500 mt-4">
            By using this software, you acknowledge that you have read, understood, 
            and agree to all terms and conditions outlined in these disclaimers.
          </p>
        </div>
      </div>
    </div>
  );
};
