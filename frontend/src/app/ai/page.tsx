'use client';

import { useState } from 'react';
import { Bot, Send, MessageCircle, Zap, Target, TrendingUp, Search } from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/hooks/useLanguage';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function AIAssistantPage() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your DLOB AI Assistant. I can help you with payment parsing, match recommendations, performance analysis, and answer questions about the badminton community. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'chat' | 'payment-parse' | 'match-recommend' | 'performance'>('chat');

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let aiResponse = '';
      
      if (activeFeature === 'payment-parse') {
        aiResponse = `I've analyzed the payment message. Based on the text, I can identify potential payment information. For example, if you send a message like "John transferred 50000 for monthly fee", I would parse:
        
- Member: John (with high confidence if John is in the member list)
- Amount: 50,000 IDR  
- Type: Monthly fee
- Confidence: 85%

Would you like me to analyze a specific payment message?`;
      } else if (activeFeature === 'match-recommend') {
        aiResponse = `I can help create fair match pairings! Based on member skill levels and recent performance, I would recommend:

**Suggested Doubles Match:**
- Team 1: John & Jane (balanced skill combination)
- Team 2: Bob & Alice (similar combined skill level)
- Expected competitiveness: 85%

This pairing considers win rates, recent performance, and ensures exciting matches. Would you like me to generate recommendations for specific members?`;
      } else if (activeFeature === 'performance') {
        aiResponse = `Here's a sample performance analysis:

**Your Badminton Performance Summary:**
- Win Rate: 75% (15 wins, 5 losses)
- Recent Trend: Improving ↗️
- Strengths: Powerful smashes, good court coverage
- Areas to improve: Net play, serve consistency
- Recommendation: Practice drop shots and focus on serve placement

Would you like me to analyze a specific member's performance?`;
      } else {
        // General chat responses
        const responses = [
          'That\'s a great question about badminton! Let me help you with that.',
          'I understand you\'re asking about the community features. Here\'s what I can tell you...',
          'Based on the community data, here\'s my recommendation:',
          'Let me analyze that for you and provide some insights.',
        ];
        aiResponse = responses[Math.floor(Math.random() * responses.length)] + ` 

Regarding "${inputMessage}", I'd be happy to help! As your DLOB AI Assistant, I can:

• Answer questions about badminton rules and techniques
• Help with community scheduling and logistics  
• Provide match statistics and player insights
• Assist with payment tracking and member management
• Offer strategic advice for improving your game

Is there something specific you'd like to know more about?`;
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      key: 'chat',
      title: 'General Chat',
      icon: MessageCircle,
      description: 'Ask questions about badminton, community, or get general help',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      key: 'payment-parse',
      title: 'Payment Parser',
      icon: Zap,
      description: 'Analyze payment messages and identify member payments',
      color: 'bg-green-100 text-green-600'
    },
    {
      key: 'match-recommend',
      title: 'Match Recommendations',
      icon: Target,
      description: 'Get AI-powered match pairings for fair and exciting games',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      key: 'performance',
      title: 'Performance Analysis',
      icon: TrendingUp,
      description: 'Analyze player performance and get improvement suggestions',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {language === 'en' ? 'AI Assistant' : 'Asisten AI'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {language === 'en' 
                    ? 'Powered by Google Gemini - Your intelligent badminton community helper' 
                    : 'Didukung oleh Google Gemini - Asisten komunitas bulu tangkis yang cerdas'}
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Feature Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Features</h3>
              <div className="space-y-3">
                {features.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <button
                      key={feature.key}
                      onClick={() => setActiveFeature(feature.key as any)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeFeature === feature.key
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${feature.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{feature.title}</div>
                          <div className="text-sm text-gray-600">{feature.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setInputMessage('Help me analyze this payment: "John paid 50000 for monthly fee"')}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                >
                  Parse sample payment
                </button>
                <button 
                  onClick={() => setInputMessage('Recommend matches for 6 players')}
                  className="w-full text-left text-sm text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded"
                >
                  Get match recommendations
                </button>
                <button 
                  onClick={() => setInputMessage('Show my performance analysis')}
                  className="w-full text-left text-sm text-orange-600 hover:text-orange-800 p-2 hover:bg-orange-50 rounded"
                >
                  Analyze performance
                </button>
                <button 
                  onClick={() => setInputMessage('What are the badminton rules for doubles?')}
                  className="w-full text-left text-sm text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                >
                  Ask about rules
                </button>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    features.find(f => f.key === activeFeature)?.color || 'bg-blue-100 text-blue-600'
                  }`}>
                    {(() => {
                      const feature = features.find(f => f.key === activeFeature);
                      if (feature) {
                        const IconComponent = feature.icon;
                        return <IconComponent className="w-4 h-4" />;
                      }
                      return <Bot className="w-4 h-4" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {features.find(f => f.key === activeFeature)?.title || 'AI Assistant'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {features.find(f => f.key === activeFeature)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Ask me anything about ${features.find(f => f.key === activeFeature)?.title.toLowerCase()}...`}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}