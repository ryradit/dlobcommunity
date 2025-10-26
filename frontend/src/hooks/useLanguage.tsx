'use client';

import { useState, useEffect } from 'react';

export function useLanguage() {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dlob-language') || 'en';
    }
    return 'en';
  });

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dlob-language', newLanguage);
    }
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('languageChange', { detail: newLanguage }));
  };

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageEvent = (event: CustomEvent) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageEvent as EventListener);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageEvent as EventListener);
    };
  }, []);

  return { language, setLanguage: handleLanguageChange };
}

// Language switcher component that can be used anywhere
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <select 
      className={`px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${className}`}
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
    >
      <option value="en" className="text-gray-700">🇺🇸 EN</option>
      <option value="id" className="text-gray-700">🇮🇩 ID</option>
    </select>
  );
}