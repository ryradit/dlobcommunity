'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { enhancedDlobAI, ChatMessage } from '@/lib/enhanced-dlob-ai';
import { supabase } from '@/lib/supabase';

interface EnhancedDlobChatbotProps {
  className?: string;
}

export default function EnhancedDlobChatbot({ className = '' }: EnhancedDlobChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize user authentication state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          // Clear chat when auth state changes
          setMessages([]);
          enhancedDlobAI.clearSession();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        text: enhancedDlobAI.getWelcomeMessage(user),
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Get AI response with user context
      const response = await enhancedDlobAI.generatePersonalizedResponse(text, user);

      setTimeout(() => {
        setIsTyping(false);
        
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          text: response.response,
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }, 800); // Simulate typing delay

    } catch (error) {
      setIsTyping(false);
      console.error('Error getting AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        text: 'Maaf, ada gangguan teknis. Coba lagi nanti ya! 🙏',
        isUser: false,
        timestamp: new Date()
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

  const quickReplies = enhancedDlobAI.getQuickReplies(user);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="group relative bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-5 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12 animate-bounce"
          style={{
            boxShadow: '0 20px 60px rgba(37, 99, 235, 0.3)',
            width: '70px',
            height: '70px'
          }}
          aria-label="Buka DLOB AI Chat"
        >
          <div className="relative flex items-center justify-center">
            {/* Chat Icon */}
            <div className="relative">
              <svg className="w-7 h-7 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {/* Pulse Ring */}
              <div className="absolute inset-0 rounded-full bg-white bg-opacity-20 animate-ping"></div>
            </div>
            
            {/* Notification badge for authenticated users */}
            {user && (
              <div className="absolute -top-2 -right-2 bg-green-400 w-4 h-4 rounded-full border-2 border-white shadow-lg">
                <div className="w-full h-full bg-green-500 rounded-full animate-ping"></div>
              </div>
            )}
            
            {/* DLOB Label */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Chat dengan DLOB AI 🏸
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100 animate-in slide-in-from-bottom-6 duration-500"
          style={{
            width: '420px',
            height: '580px',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-5 rounded-t-2xl flex justify-between items-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <circle cx="20" cy="20" r="2" fill="white"/>
                <circle cx="80" cy="20" r="1.5" fill="white"/>
                <circle cx="20" cy="80" r="1" fill="white"/>
                <circle cx="80" cy="80" r="2.5" fill="white"/>
              </svg>
            </div>
            
            <div className="flex items-center space-x-4 relative">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-30 p-1">
                <Image 
                  src="/dlobai.png" 
                  alt="DLOB AI" 
                  width={48}
                  height={48}
                  className="object-cover rounded-xl"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">DLOB AI</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-blue-100 font-medium">
                    {user ? `${user.email?.split('@')[0] || 'Member'} • Personal Mode` : 'Guest Mode'} 
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="relative text-white hover:text-gray-200 transition-all duration-300 p-2 rounded-xl hover:bg-white hover:bg-opacity-20 group"
              aria-label="Tutup chat"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-linear-to-b from-gray-50 to-white" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 text-sm transition-all duration-300 hover:scale-105 ${
                    message.isUser
                      ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md shadow-lg'
                      : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-md border border-gray-100 hover:shadow-lg'
                  }`}
                  style={{
                    boxShadow: message.isUser 
                      ? '0 8px 20px rgba(37, 99, 235, 0.3)' 
                      : '0 4px 15px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="leading-relaxed">{message.text}</div>
                  <div className={`text-xs mt-2 flex items-center justify-end space-x-1 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span>{message.timestamp.toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</span>
                    {message.isUser && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="bg-white text-gray-500 px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-gray-100 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                    <div className="w-2.5 h-2.5 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">AI sedang mengetik...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="px-6 py-4 bg-linear-to-r from-blue-50 to-purple-50 border-t border-gray-100">
              <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Pertanyaan Populer:
              </div>
              <div className="flex flex-wrap gap-2">
                {quickReplies.slice(0, 3).map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(reply)}
                    className="text-sm bg-white text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all duration-300 hover:scale-105 shadow-sm border border-blue-200 font-medium"
                    disabled={isLoading}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t bg-white rounded-b-2xl">
            <style jsx>{`
              input::placeholder {
                color: #6B7280 !important;
                opacity: 1 !important;
              }
              input:disabled::placeholder {
                color: #9CA3AF !important;
                opacity: 0.7 !important;
              }
            `}</style>
            <div className="flex space-x-3 items-end">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={user ? "Tanya tentang tagihan, match, kehadiran..." : "Ketik pesan..."}
                  className="w-full border-2 border-gray-200 rounded-2xl px-5 py-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white"
                  style={{ 
                    color: isLoading ? '#6B7280' : '#111827',
                    WebkitTextFillColor: isLoading ? '#6B7280' : '#111827'
                  }}
                  disabled={isLoading}
                />
                {/* Character count for longer messages */}
                {inputValue.length > 100 && (
                  <div className="absolute -top-6 right-2 text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded shadow-sm">
                    {inputValue.length}/500
                  </div>
                )}
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl p-3 transition-all duration-300 hover:scale-110 hover:rotate-12 disabled:scale-100 disabled:rotate-0 shadow-lg hover:shadow-xl"
                style={{
                  boxShadow: inputValue.trim() ? '0 8px 20px rgba(37, 99, 235, 0.3)' : 'none'
                }}
                aria-label="Kirim pesan"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center justify-between mt-4 text-xs">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-full">
                <div className={`w-2.5 h-2.5 rounded-full ${user ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <span className="font-medium text-gray-600">
                  {user ? 'Mode Personal' : 'Mode Umum'}
                </span>
              </div>
              {enhancedDlobAI.isConfigured() && (
                <div className="flex items-center space-x-2 bg-blue-100 px-3 py-2 rounded-full">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-blue-700">Aktif</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}