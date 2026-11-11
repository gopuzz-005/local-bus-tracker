import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const Drivers = () => {
  const { t } = useLanguage();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data } = await api.get('/admin/drivers');
        setDrivers(data || []);
      } catch (err) {
        console.error('Error fetching admin drivers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span>👨‍✈️</span> {t("Drivers")} Directory
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Registered and licensed bus operators across regions.
        </p>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {loading ? (
          <p className="text-slate-400 p-8 text-center">Loading drivers directory...</p>
        ) : drivers.length === 0 ? (
          <p className="text-slate-400 p-8 text-center italic">No drivers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/70 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Operator Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {drivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{driver.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{driver.email}</td>
                    <td className="py-3.5 px-4 text-slate-300">{driver.phone || 'Standard Fleet Contact'}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">
                        {driver.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {new Date(driver.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Drivers;
