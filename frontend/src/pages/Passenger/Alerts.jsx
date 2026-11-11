import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const Alerts = () => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await api.get('/alerts');
        setAlerts(data);
      } catch (error) {
        console.error("Error fetching alerts", error);
      }
      setLoading(false);
    };
    fetchAlerts();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">{t("Alerts")}</h1>
      
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert._id} className={`p-4 rounded-xl border ${alert.severity === 'High' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <div className="flex justify-between items-start">
                <h3 className={`font-bold ${alert.severity === 'High' ? 'text-red-400' : 'text-amber-400'}`}>
                  {alert.title}
                </h3>
                <span className="text-xs text-slate-500">{new Date(alert.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-300 mt-2 text-sm">{alert.message}</p>
              {alert.route && <p className="text-xs text-slate-400 mt-2">Route: {alert.route.routeName || alert.route}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-400">
          No active alerts.
        </div>
      )}
    </div>
  );
};

export default Alerts;
