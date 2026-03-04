'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Copy, Check, Dumbbell, HelpCircle, ExternalLink, Play } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  videos?: YouTubeVideo[];
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  url: string;
}

export default function FloatingAIChat() {
  const { user, isAdmin, viewAs, loading: authLoading, session } = useAuth();
  // Respect the current view — an admin switched to member view acts as member
  const userRole = !user ? 'guest' : (isAdmin && viewAs === 'member') ? 'member' : isAdmin ? 'admin' : 'member';
  const rawEmail = user?.email || '';
  const emailName = rawEmail ? rawEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Pengguna';
  const userName = (user?.user_metadata?.full_name as string | undefined) || emailName;
  const userPhone = (user?.user_metadata?.phone as string | undefined) || null;

  const buildGreeting = (role: string, name: string) => {
    if (role === 'admin')
      return `Halo Admin ${name}! 👋\n\nSaya Dlob Agent — asisten cerdas DLOB. Saya bisa:\n\n📋 Rekap tagihan yang belum dibayar\n📲 Kirim reminder WA ke member\n📊 Statistik komunitas\n🏸 Coaching & tips badminton\n\nAda yang bisa saya bantu?`;
    if (role === 'member')
      return `Halo ${name}! 👋\n\nSaya Dlob Agent — asisten pribadi kamu di DLOB. Saya bisa:\n\n💳 Cek tagihan & status pembayaran kamu\n🏆 Statistik & win rate pertandinganmu\n🎫 Cek status membership\n🏸 Coaching & tips badminton\n\nAda yang bisa saya bantu?`;
    return 'Halo! Saya Dlob Agent — asisten pintar DLOB.\n\n🏸 Info komunitas & membership\n💪 Coaching & teknik bermain\n\nAda yang bisa saya bantu?';
  };

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: buildGreeting('guest', '') }
  ]);
  const [greetingSet, setGreetingSet] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Update greeting once auth finishes loading
  useEffect(() => {
    if (authLoading) return;
    if (greetingSet) return;
    setMessages([{ role: 'assistant', content: buildGreeting(userRole, userName) }]);
    setGreetingSet(true);
  }, [authLoading, userRole, userName, greetingSet]);

  // Re-update greeting when full_name arrives via user metadata (may load after auth)
  // Only if user hasn't started chatting yet
  const fullName = user?.user_metadata?.full_name as string | undefined;
  useEffect(() => {
    if (!fullName) return;
    if (messagesRef.current.length > 1) return; // conversation started, don't reset
    setMessages([{ role: 'assistant', content: buildGreeting(userRole, fullName) }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, userRole]);

  // Reset chat when admin switches between admin/member view
  const prevViewAs = useRef(viewAs);
  useEffect(() => {
    if (authLoading) return;
    if (prevViewAs.current === viewAs) return;
    prevViewAs.current = viewAs;
    setMessages([{ role: 'assistant', content: buildGreeting(userRole, userName) }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAs]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const authToken = session?.access_token;

      // Unified Dlob Agent - handles all types of queries
      const response = await fetch('/api/ai/dlob-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          conversationHistory: messages,
          userRole,
          userName,
          userPhone,
          authToken,
        })
      });

      if (!response.ok) throw new Error('Gagal mendapatkan respons');

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        videos: data.videos || undefined
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi admin untuk bantuan lebih lanjut.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = isAdmin
    ? [
        'Siapa yang belum bayar?',
        'Kirim reminder ke semua',
        'Statistik komunitas bulan ini',
        'Pertandingan terbaru',
      ]
    : user
    ? [
        'Tagihan saya berapa?',
        'Win rate saya?',
        'Status membership saya',
        'Tips smash kuat',
      ]
    : [
        'Cara bergabung DLOB?',
        'Tips smash kuat',
        'Cara bayar membership',
        'Jadwal latihan',
      ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatMessageWithCopyButton = (content: string) => {
    const phoneRegex = /(0\d{3}-\d{4}-\d{4}|0\d{10,11})/g;
    const parts = content.split(phoneRegex);
    
    return parts.map((part, index) => {
      if (phoneRegex.test(part)) {
        return (
          <span key={index} className="inline-flex items-center gap-2 bg-gray-200 dark:bg-zinc-700/40 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 my-1 transition-all duration-300">
            <span className="font-mono text-sm font-semibold text-[#3e6461]">{part}</span>
            <button
              onClick={() => copyToClipboard(part)}
              className="p-1 hover:bg-gray-300 dark:hover:bg-zinc-600/50 rounded transition-all group"
              title="Salin nomor"
            >
              {copiedPhone ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              )}
            </button>
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 backdrop-blur-xl ${
          isOpen
            ? 'bg-gradient-to-br from-red-500/80 to-red-600/80 hover:from-red-600/80 hover:to-red-700/80 scale-110'
            : 'bg-gradient-to-br from-[#3e6461]/90 to-[#2d4a47]/90 hover:from-[#3e6461] hover:to-[#2d4a47] hover:scale-110'
        } border border-white/20`}
        aria-label="DLOB AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[620px] max-h-[calc(100vh-160px)] flex flex-col overflow-hidden">
          {/* Glassmorphic Container */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-gray-50/95 to-gray-100/95 dark:from-zinc-900/95 dark:via-zinc-950/95 dark:to-black/95 backdrop-blur-2xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl transition-all duration-300" />
          
          {/* Content */}
          <div className="relative flex flex-col h-full">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#3e6461]/80 to-[#2d4a47]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 rounded-t-3xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30 overflow-hidden">
                    <Image
                      src="/dlobai.png"
                      alt="DLOB AI"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#3e6461]/80 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm tracking-tight leading-tight">Dlob Agent</h3>
                  <p className="text-[11px] text-white/70 truncate">AI Assistant DLOB</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {messages.map((message, index) => (
                <div key={index}>
                  <div
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 bg-gradient-to-br from-[#3e6461]/30 to-[#2d4a47]/30 backdrop-blur-xl rounded-full flex items-center justify-center mr-2 mt-1 border border-[#3e6461]/20 dark:border-white/10 flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-[#3e6461]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-3.5 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-[#3e6461]/90 to-[#2d4a47]/90 text-white rounded-br-md border-[#3e6461]/30 shadow-lg'
                          : 'bg-gray-100 dark:bg-zinc-800/60 text-gray-900 dark:text-zinc-100 rounded-bl-md border-gray-200 dark:border-white/5'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.role === 'assistant' ? formatMessageWithCopyButton(message.content) : message.content}
                      </p>
                    </div>
                  </div>

                  {/* YouTube Videos */}
                  {message.videos && message.videos.length > 0 && (
                    <div className="ml-9 mt-2 space-y-2">
                      <p className="text-xs text-zinc-400 font-semibold mb-2">📹 Video Tutorial:</p>
                      {message.videos.map((video) => (
                        <a
                          key={video.id}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <div className="flex gap-2 bg-zinc-800/40 hover:bg-zinc-800/60 p-2 rounded-lg border border-white/5 hover:border-white/10 transition-all">
                            <div className="relative w-28 h-16 flex-shrink-0 rounded overflow-hidden">
                              <Image
                                src={video.thumbnail}
                                alt={video.title}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                              <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px] text-white font-semibold">
                                {video.duration}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-zinc-200 line-clamp-2 mb-1 group-hover:text-white transition-colors">
                                {video.title}
                              </h4>
                              <p className="text-[10px] text-zinc-500 line-clamp-1">{video.channelTitle}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <ExternalLink className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] text-zinc-500">Tonton di YouTube</span>
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-gradient-to-br from-[#3e6461]/30 to-[#2d4a47]/30 backdrop-blur-xl rounded-full flex items-center justify-center mr-2 mt-1 border border-white/10 flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#3e6461]" />
                  </div>
                  <div className="bg-zinc-800/60 backdrop-blur-xl text-zinc-100 p-3.5 rounded-2xl rounded-bl-md border border-white/5 transition-all duration-300">
                    <Loader2 className="w-5 h-5 animate-spin text-[#3e6461]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-3">
                <p className="text-xs text-gray-600 dark:text-zinc-400 font-medium mb-2.5 transition-colors duration-300">Pertanyaan umum:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs px-3 py-2.5 bg-gray-100 dark:bg-zinc-800/60 hover:bg-gray-200 dark:hover:bg-zinc-700/60 backdrop-blur-xl text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all duration-300 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 text-left font-medium"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-b-3xl transition-all duration-300">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya apa saja tentang badminton, performa, atau DLOB..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-white dark:bg-zinc-800/60 backdrop-blur-xl border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-[#3e6461]/50 focus:ring-2 focus:ring-[#3e6461]/20 disabled:opacity-50 transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-gradient-to-br from-[#3e6461]/90 to-[#2d4a47]/90 hover:from-[#3e6461] hover:to-[#2d4a47] disabled:from-gray-400/60 dark:disabled:from-zinc-700/60 disabled:to-gray-400/60 dark:disabled:to-zinc-700/60 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 backdrop-blur-xl border border-white/10 disabled:border-gray-300 dark:disabled:border-white/5"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
