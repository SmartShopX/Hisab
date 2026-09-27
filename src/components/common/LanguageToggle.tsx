import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageToggleProps {
  variant?: 'compact' | 'pill' | 'segmented' | 'dropdown-item';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 ${className}`}
        role="group"
        aria-label="Language selector"
      >
        <button
          type="button"
          onClick={() => setLanguage('bn')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            language === 'bn'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'bn' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          <span>বাংলা (BN)</span>
        </button>

        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'en' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          <span>English (EN)</span>
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer ${className}`}
        title="Toggle between Bengali & English"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600" />
        <span>{language === 'bn' ? 'বাংলা' : 'English'}</span>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
          {language === 'bn' ? 'BN' : 'EN'}
        </span>
      </button>
    );
  }

  // Compact Header Toggle (Default)
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-700 text-xs font-bold shadow-2xs hover:border-emerald-300 transition-all cursor-pointer group ${className}`}
      title={language === 'bn' ? 'Switch to English interface' : 'বাংলা ভাষায় পরিবর্তন করুন'}
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
      <div className="flex items-center gap-1 font-mono text-[11px]">
        <span className={language === 'bn' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
          BN
        </span>
        <span className="text-slate-300">/</span>
        <span className={language === 'en' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
          EN
        </span>
      </div>
    </button>
  );
};
