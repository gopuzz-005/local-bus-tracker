import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

const TopHeader = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between shadow-md">
      {/* Left side: Brand or Section context */}
      <div className="flex items-center gap-3 pl-12 md:pl-0">
        <span className="text-xl">🚌</span>
        <div>
          <span className="font-bold text-white text-sm md:text-base tracking-wide block">
            Local Bus Transit System
          </span>
          <span className="text-[11px] text-blue-400 font-medium capitalize">
            {user.role} Portal • Kerala & Tamil Nadu
          </span>
        </div>
      </div>

      {/* Right side: Language Selector & User Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Prominent Language Selector placed at Top Right */}
        <div className="flex items-center" id="top-right-language-selector">
          <LanguageSelector />
        </div>

        {/* User Mini Profile */}
        <div className="hidden sm:flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
              {user.name}
            </span>
            <span className="text-[10px] text-emerald-400 capitalize block leading-tight">
              {user.role}
            </span>
          </div>
        </div>

        {/* Quick Sign Out Button */}
        <button
          onClick={logout}
          className="text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/80 border border-rose-500/20 px-3 py-1.5 rounded-xl transition-all"
          title={t("Logout")}
        >
          {t("Logout")}
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
