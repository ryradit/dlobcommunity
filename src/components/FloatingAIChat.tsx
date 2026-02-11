'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya DLOB AI Assistant. Ada yang bisa saya bantu mengenai komunitas badminton DLOB?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }]
        })
      });

      if (!response.ok) throw new Error('Gagal mendapatkan respons');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi admin untuk bantuan lebih lanjut.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    'Bagaimana cara bergabung?',
    'Cara bayar membership?',
    'Cara upload bukti pembayaran?',
    'Fitur apa saja di dashboard?'
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
          <span key={index} className="inline-flex items-center gap-2 bg-zinc-700/40 px-2.5 py-1.5 rounded-lg border border-white/10 my-1">
            <span className="font-mono text-sm font-semibold text-[#3e6461]">{part}</span>
            <button
              onClick={() => copyToClipboard(part)}
              className="p-1 hover:bg-zinc-600/50 rounded transition-all group"
              title="Salin nomor"
            >
              {copiedPhone ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
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
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/95 via-zinc-950/95 to-black/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl" />
          
          {/* Content */}
          <div className="relative flex flex-col h-full">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#3e6461]/80 to-[#2d4a47]/80 backdrop-blur-xl border-b border-white/10 p-5 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30 overflow-hidden">
                    <Image
                      src="/dlobai.png"
                      alt="DLOB AI"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-[#3e6461]/80 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg tracking-tight">DLOB AI Assistant</h3>
                  <p className="text-xs text-white/90 font-medium">Siap membantu Anda 24/7</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-[#3e6461]/30 to-[#2d4a47]/30 backdrop-blur-xl rounded-full flex items-center justify-center mr-2 mt-1 border border-white/10 flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-[#3e6461]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-3.5 rounded-2xl backdrop-blur-xl border ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[#3e6461]/90 to-[#2d4a47]/90 text-white rounded-br-md border-[#3e6461]/30 shadow-lg'
                        : 'bg-zinc-800/60 text-zinc-100 rounded-bl-md border-white/5'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.role === 'assistant' ? formatMessageWithCopyButton(message.content) : message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-gradient-to-br from-[#3e6461]/30 to-[#2d4a47]/30 backdrop-blur-xl rounded-full flex items-center justify-center mr-2 mt-1 border border-white/10 flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#3e6461]" />
                  </div>
                  <div className="bg-zinc-800/60 backdrop-blur-xl text-zinc-100 p-3.5 rounded-2xl rounded-bl-md border border-white/5">
                    <Loader2 className="w-5 h-5 animate-spin text-[#3e6461]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-3">
                <p className="text-xs text-zinc-400 font-medium mb-2.5">Pertanyaan umum:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs px-3 py-2.5 bg-zinc-800/60 hover:bg-zinc-700/60 backdrop-blur-xl text-zinc-300 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/10 text-left font-medium"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 backdrop-blur-xl rounded-b-3xl">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pertanyaan Anda..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-zinc-800/60 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#3e6461]/50 focus:ring-2 focus:ring-[#3e6461]/20 disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-gradient-to-br from-[#3e6461]/90 to-[#2d4a47]/90 hover:from-[#3e6461] hover:to-[#2d4a47] disabled:from-zinc-700/60 disabled:to-zinc-700/60 disabled:cursor-not-allowed text-white rounded-xl transition-all backdrop-blur-xl border border-white/10 disabled:border-white/5"
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
