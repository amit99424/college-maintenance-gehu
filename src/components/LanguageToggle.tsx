"use client";

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="relative">
      <button
        onClick={toggleLanguage}
        className="relative flex items-center justify-between w-20 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/30 transition-all duration-300 hover:shadow-xl hover:bg-white/95"
        aria-label="Toggle language"
      >
        {/* EN Label */}
        <span
          className={`absolute left-2 text-xs font-semibold transition-all duration-300 ${
            language === 'en'
              ? 'text-blue-600 opacity-100'
              : 'text-gray-500 opacity-60'
          }`}
        >
          EN
        </span>

        {/* Toggle Circle */}
        <div
          className={`absolute w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-md transition-all duration-300 transform ${
            language === 'hi' ? 'translate-x-10' : 'translate-x-1'
          }`}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full"></div>
        </div>

        {/* HI Label */}
        <span
          className={`absolute right-2 text-xs font-semibold transition-all duration-300 ${
            language === 'hi'
              ? 'text-blue-600 opacity-100'
              : 'text-gray-500 opacity-60'
          }`}
        >
          HI
        </span>
      </button>

      {/* Subtle glow effect for active state */}
      {language === 'en' && (
        <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-sm -z-10"></div>
      )}
      {language === 'hi' && (
        <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-sm -z-10 translate-x-10"></div>
      )}
    </div>
  );
}
