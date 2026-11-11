import React, { useContext } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AuthContext from '../../context/AuthContext';

const DriverProfile = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">👤 {t("Profile")}</h1>
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl border border-slate-700 text-slate-300 space-y-4">
        <div>
          <label className="text-xs text-slate-500 uppercase">Name</label>
          <p className="text-lg font-bold text-white">{user.name}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase">Email</label>
          <p className="text-lg font-bold text-white">{user.email}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase">Role</label>
          <p className="text-lg font-bold text-blue-400 capitalize">{user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
