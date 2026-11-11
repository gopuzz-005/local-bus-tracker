import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Alerts = () => {
  const { t } = useLanguage();
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">{t("Alerts")}</h1>
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl border border-slate-700 text-slate-300">
        <p>This page is fully accessible. Replace with real Alerts logic.</p>
      </div>
    </div>
  );
};

export default Alerts;
