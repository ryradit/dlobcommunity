'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, CheckCircle, Loader2 } from 'lucide-react';

interface Message {
  role: 'ai' | 'user';
  message: string;
  timestamp: string;
}

interface SurveyAgentProps {
  instanceId: string;
  memberId?: string; // Optional for anonymous users
  surveyTitle: string;
  onComplete?: () => void;
}

export default function SurveyAgent({
  instanceId,
  memberId,
  surveyTitle,
  onComplete,
}: SurveyAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load welcome message on mount
  useEffect(() => {
    const loadInitialMessage = async () => {
      try {
        console.log('🚀 Starting survey with:', { instanceId, memberId });
        
        // Get the first question from AI
        const response = await fetch('/api/survey/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            responseId: null,
            userMessage: 'Mulai',
            instanceId,
            memberId,
          }),
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', JSON.stringify(data, null, 2));

        if (response.ok) {
          setResponseId(data.responseId);
          const aiMessage: Message = {
            role: 'ai',
            message: data.aiMessage,
            timestamp: new Date().toISOString(),
          };
          setMessages([aiMessage]);
        } else {
          console.error('❌ Failed to load survey:', {
            status: response.status,
            statusText: response.statusText,
            data
          });
          const errorMessage: Message = {
            role: 'ai',
            message: `Maaf, tidak bisa memuat survey. Error: ${data.details || data.error || JSON.stringify(data)}`,
            timestamp: new Date().toISOString(),
          };
          setMessages([errorMessage]);
        }
      } catch (error) {
        console.error('💥 Exception loading initial message:', error);
        const welcomeMessage: Message = {
          role: 'ai',
          message: `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}. Silakan refresh halaman.`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }
    };

    loadInitialMessage();
  }, [surveyTitle, instanceId, memberId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      message: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/survey/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responseId,
          userMessage: inputValue,
          instanceId,
          memberId,
        }),
      });

      const data = await response.json();
      
      console.log('API response:', { status: response.status, data });

      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.details || data.error || 'Gagal mengirim pesan');
      }

      // Save response ID for subsequent messages
      if (!responseId) {
        setResponseId(data.responseId);
      }

      // Add AI response
      const aiMessage: Message = {
        role: 'ai',
        message: data.aiMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Check if survey is complete
      if (data.isComplete) {
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }

    } catch (error) {
      console.error('Survey error:', error);
      
      // Extract error details if available
      let errorText = 'Maaf, terjadi kesalahan. Silakan coba lagi. 😅';
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        errorText = `Maaf, terjadi kesalahan: ${error.message}`;
      }
      
      const errorMessage: Message = {
        role: 'ai',
        message: errorText,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3e6461] to-[#1e4843] text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold">AI Survey Assistant</h3>
            <p className="text-xs text-white/80">{surveyTitle}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'ai' 
                  ? 'bg-gradient-to-br from-[#3e6461] to-[#1e4843] text-white' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
              }`}>
                {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'ai'
                    ? 'bg-white shadow-md border border-slate-200'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                }`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'ai' ? 'text-slate-800' : 'text-white'
                  }`}>
                    {msg.message}
                  </p>
                </div>
                <span className="text-xs text-slate-400 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3e6461] to-[#1e4843] text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-slate-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-slate-800">Survey Selesai!</p>
            <p className="text-sm text-slate-600">Terima kasih atas partisipasi Anda 🎉</p>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isComplete && (
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik jawaban Anda..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3e6461] focus:border-transparent disabled:opacity-50 text-slate-800 placeholder-slate-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[#3e6461] to-[#1e4843] text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Tekan Enter untuk mengirim • Jawab dengan santai dan jujur
          </p>
        </div>
      )}
    </div>
  );
}
