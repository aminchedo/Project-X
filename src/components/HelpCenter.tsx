import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Search, Book, Video, MessageCircle, ExternalLink } from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: string;
}

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'getting-started', 'trading', 'signals', 'risk-management'];

  const topics: HelpTopic[] = [
    { id: '1', title: 'Getting Started Guide', description: 'Learn the basics of the platform', category: 'getting-started' },
    { id: '2', title: 'How to Execute Trades', description: 'Step-by-step trading guide', category: 'trading' },
    { id: '3', title: 'Understanding Signals', description: 'Learn how to interpret trading signals', category: 'signals' },
    { id: '4', title: 'Risk Management Best Practices', description: 'Protect your portfolio', category: 'risk-management' },
    { id: '5', title: 'Setting Up Alerts', description: 'Configure custom alerts', category: 'getting-started' },
    { id: '6', title: 'Strategy Builder Tutorial', description: 'Create automated strategies', category: 'trading' }
  ];

  const filteredTopics = topics.filter(topic =>
    (selectedCategory === 'all' || topic.category === selectedCategory) &&
    (searchQuery === '' || topic.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <HelpCircle className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-50">Help Center</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help articles..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start gap-3">
                  <Book className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-slate-50 font-semibold mb-1">{topic.title}</h3>
                    <p className="text-sm text-slate-400">{topic.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button className="flex items-center gap-3 p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-purple-400" />
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-50">Video Tutorials</div>
              <div className="text-xs text-slate-400">Watch & learn</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5 text-green-400" />
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-50">Contact Support</div>
              <div className="text-xs text-slate-400">Get help now</div>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HelpCenter;
