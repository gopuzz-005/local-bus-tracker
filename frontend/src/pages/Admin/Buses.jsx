import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const Buses = () => {
  const { t } = useLanguage();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const { data } = await api.get('/buses');
        setBuses(data || []);
      } catch (err) {
        console.error('Error fetching admin buses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>🚌</span> {t("Buses")} Fleet Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Registered transit vehicles, real-time status, and driver assignments.
          </p>
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {loading ? (
          <p className="text-slate-400 p-8 text-center">Loading fleet inventory...</p>
        ) : buses.length === 0 ? (
          <p className="text-slate-400 p-8 text-center italic">No buses registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/70 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Bus Name</th>
                  <th className="py-3.5 px-4">Reg Number</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Assigned Driver</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {buses.map((bus) => (
                  <tr key={bus._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{bus.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">{bus.busNumber}</td>
                    <td className="py-3.5 px-4 text-blue-300">{bus.type}</td>
                    <td className="py-3.5 px-4">{bus.operator || 'Fleet Operator'}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {bus.driver?.name || bus.currentDriver?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          bus.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {bus.status || 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {bus.currentLocation?.lat ? `${bus.currentLocation.lat.toFixed(4)}, ${bus.currentLocation.lng.toFixed(4)}` : 'N/A'}
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

export default Buses;
