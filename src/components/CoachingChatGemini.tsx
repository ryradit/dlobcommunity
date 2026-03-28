'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Trash2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
  // Structured data from API (for coach messages)
  keyFinding?: any;
  actionItems?: any[];
  expectedResults?: any;
  responseType?: string;
}

interface CoachingSessionRecord {
  id: string;
  user_id: string;
  session_id: string;
  member_name: string;
  query: string;
  response: string;
  created_at: string;
}

interface CoachingChatGeminiProps {
  memberName: string;
}

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CoachingChatGemini: React.FC<CoachingChatGeminiProps> = ({ memberName }) => {
  const { user } = useAuth();
  const userId = user?.id;

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CoachingSessionRecord[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [actualMemberName, setActualMemberName] = useState<string>(memberName);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializationAttempted = useRef(false);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session on mount
  useEffect(() => {
    // Prevent multiple initializations (React 18 StrictMode runs effects twice in dev)
    if (!userId || initializationAttempted.current) {
      console.log('[CoachingChat] Initialization already attempted or no userId');
      return;
    }

    initializationAttempted.current = true;
    console.log('[CoachingChat] Starting single initialization...');

    const initializeSession = async () => {
      // Check if already have a session from today
      const storedSessionId = localStorage.getItem(`coaching_session_${userId}`);
      const storedDate = localStorage.getItem(`coaching_session_${userId}_date`);
      const today = new Date().toDateString();
      const storedToday = storedDate ? new Date(storedDate).toDateString() : null;

      let activeSessionId = storedSessionId;

      // If no session or session is from a different day, create new one
      if (!storedSessionId || storedToday !== today) {
        activeSessionId = crypto.randomUUID();
        localStorage.setItem(`coaching_session_${userId}`, activeSessionId);
        localStorage.setItem(`coaching_session_${userId}_date`, new Date().toISOString());
        console.log('[CoachingChat] 🆕 New session created:', activeSessionId);
      } else {
        console.log('[CoachingChat] ♻️ Restoring session from today:', activeSessionId);
      }

      setSessionId(activeSessionId);

      // Load session history (all sessions ever)
      const { data: sessions, error } = await supabaseClient
        .from('coaching_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && sessions) {
        setSessionHistory(sessions);
        console.log('[CoachingChat] Loaded session history:', sessions.length, 'sessions');

        // Auto-load messages from the active session
        if (activeSessionId && sessions.length > 0) {
          const sessionsForActiveId = sessions.filter((s) => s.session_id === activeSessionId);
          if (sessionsForActiveId.length > 0) {
            const loadedMessages: Message[] = [];
            sessionsForActiveId.forEach((record) => {
              if (record.query) {
                loadedMessages.push({
                  id: `${record.id}-user`,
                  role: 'user',
                  content: record.query,
                  timestamp: new Date(record.created_at),
                });
              }
              if (record.response) {
                // Extract structured data from insights JSONB column
                const insights = record.insights || {};
                loadedMessages.push({
                  id: `${record.id}-coach`,
                  role: 'coach',
                  content: record.response,
                  timestamp: new Date(record.created_at),
                  // Restore structured data from insights
                  keyFinding: insights.keyFinding,
                  actionItems: insights.actionItems,
                  expectedResults: insights.expectedResults,
                  responseType: insights.responseType,
                });
              }
            });
            setMessages(loadedMessages);
            console.log('[CoachingChat] ✓ Auto-loaded', loadedMessages.length, 'messages with structured data');
          }
        }
      }
    };

    initializeSession();
  }, [userId]);

  // Load session messages
  const loadSessionMessages = async (loadSessionId: string) => {
    if (!userId) return;

    const { data: records, error } = await supabaseClient
      .from('coaching_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', loadSessionId)
      .order('created_at', { ascending: true });

    if (!error && records) {
      const loadedMessages: Message[] = [];
      records.forEach((record) => {
        if (record.query) {
          loadedMessages.push({
            id: `${record.id}-user`,
            role: 'user',
            content: record.query,
            timestamp: new Date(record.created_at),
          });
        }
        if (record.response) {
          // Extract structured data from insights JSONB column
          const insights = record.insights || {};
          loadedMessages.push({
            id: `${record.id}-coach`,
            role: 'coach',
            content: record.response,
            timestamp: new Date(record.created_at),
            // Restore structured data from insights
            keyFinding: insights.keyFinding,
            actionItems: insights.actionItems,
            expectedResults: insights.expectedResults,
            responseType: insights.responseType,
          });
        }
      });
      setMessages(loadedMessages);
      console.log('[CoachingChat] ✓ Loaded', loadedMessages.length, 'messages with structured data from insights');
    }
  };

  // Start new conversation
  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setMessages([]);
    setInput('');
    if (userId) {
      localStorage.setItem(`coaching_session_${userId}`, newSessionId);
    }
  };

  // Delete session
  const handleDeleteSession = async (deleteSessionId: string) => {
    if (!userId) return;

    const { error } = await supabaseClient
      .from('coaching_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', deleteSessionId);

    if (!error) {
      setSessionHistory((prev) => prev.filter((s) => s.session_id !== deleteSessionId));
      if (sessionId === deleteSessionId) {
        handleNewChat();
      }
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const messageText = input.trim();
    
    // Validate message and session
    if (!messageText) {
      console.warn('[CoachingChat] ⚠️ Empty message');
      return;
    }
    
    if (!sessionId) {
      console.error('[CoachingChat] ❌ No sessionId! Initialization may not be complete. Current sessionId:', sessionId);
      return;
    }

    console.log('[CoachingChat] 📤 Sending message with sessionId:', sessionId);

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call coach API (API will save to database automatically)
      const response = await fetch('/api/ai/coach-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageText,
          userId,
          memberName: actualMemberName,
          sessionId, // Pass sessionId so API can save with session grouping
          sessionHistory: messages.map((m) => ({
            query: m.role === 'user' ? m.content : undefined,
            response: m.role === 'coach' ? m.content : undefined,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get coach response');

      const data = await response.json();
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: data.response || 'Maaf, saya tidak bisa merespons sekarang.',
        timestamp: new Date(),
        // Store structured data from API response
        keyFinding: data.keyFinding,
        actionItems: data.actionItems,
        expectedResults: data.expectedResults,
        responseType: data.responseType,
      };

      setMessages((prev) => [...prev, coachMessage]);

      // Conversation is automatically saved by the API, no need for client-side save
      console.log('[CoachingChat] ✓ Coaching exchange saved automatically by API');
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'coach',
          content: 'Oops! Ada error. Coba lagi.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get session title (first few characters of first message)
  const getSessionTitle = (record: CoachingSessionRecord) => {
    return record.query?.substring(0, 30) || 'New Chat';
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            New Chat
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 px-2 mb-3">
            Chat History
          </h3>
          {sessionHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No chat history yet
            </p>
          ) : (
            sessionHistory.map((session) => (
              <div
                key={session.session_id}
                className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                  sessionId === session.session_id
                    ? 'bg-gray-200 dark:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  setSessionId(session.session_id);
                  loadSessionMessages(session.session_id);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                      {getSessionTitle(session)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.session_id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <MessageCircle size={24} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Badminton Coach AI
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Training with {actualMemberName}
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageCircle size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Chat dengan AI Coach
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Tanyakan tentang teknik, strategi permainan, atau analisis performa badminton kamu
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-xl px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
          <div className="flex gap-4 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tanya Coach tentang teknik, strategi, atau analisis performa..."
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full font-medium transition-colors flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default CoachingChatGemini;
