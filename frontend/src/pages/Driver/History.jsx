import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const History = () => {
  const { t } = useLanguage();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/trips/driver-history');
        setTrips(data || []);
      } catch (err) {
        console.error('Error fetching driver history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">🕒 {t("History")}</h1>
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl border border-slate-700 text-slate-300 shadow-xl">
        {loading ? (
          <p className="text-slate-400 py-6 text-center">Loading trip history...</p>
        ) : trips.length === 0 ? (
          <p className="text-slate-400 py-6 text-center italic">No completed trip history found on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-2">Date & Time</th>
                  <th className="py-3 px-2">Bus</th>
                  <th className="py-3 px-2">Route</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm">
                {trips.map((trip) => (
                  <tr key={trip._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-slate-300">
                      {new Date(trip.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-white">{trip.bus?.name || 'Bus'}</span>
                      <span className="text-slate-400 font-mono text-xs ml-1.5">({trip.bus?.busNumber})</span>
                    </td>
                    <td className="py-3 px-2 font-medium text-blue-400">
                      {trip.route?.routeName || trip.route?.routeNumber || 'Transit Route'}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          trip.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : trip.status === 'ACTIVE'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {trip.status}
                      </span>
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

export default History;
