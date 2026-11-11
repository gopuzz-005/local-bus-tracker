import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = ({ variant = 'default' }) => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className={`relative inline-flex items-center gap-2 ${variant === 'auth' ? 'bg-slate-800/90 border border-slate-600/80 shadow-lg' : 'bg-slate-800/80 border border-slate-700/80'} rounded-xl px-3 py-1.5 backdrop-blur-md transition-all hover:border-blue-500`}>
      <span className="text-base select-none" role="img" aria-label="Language">🌐</span>
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent text-white text-xs md:text-sm font-semibold outline-none cursor-pointer pr-1"
        aria-label="Select Application Language"
      >
        <option value="English" className="bg-slate-900 text-white">English (EN)</option>
        <option value="Tamil" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
        <option value="Malayalam" className="bg-slate-900 text-white">മലയാളം (Malayalam)</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
