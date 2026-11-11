import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const Trips = () => {
  const { t } = useLanguage();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data } = await api.get('/trips');
        setTrips(data || []);
      } catch (err) {
        console.error('Error fetching admin trips:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span>🔄</span> {t("Trips")} Monitoring
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Active, completed, and scheduled vehicle dispatch operations.
        </p>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {loading ? (
          <p className="text-slate-400 p-8 text-center">Loading trips...</p>
        ) : trips.length === 0 ? (
          <p className="text-slate-400 p-8 text-center italic">No trips on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/70 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Bus</th>
                  <th className="py-3.5 px-4">Driver</th>
                  <th className="py-3.5 px-4">Route</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Start Time</th>
                  <th className="py-3.5 px-4">End Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {trips.map((trip) => (
                  <tr key={trip._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {trip.bus?.name || 'Bus'}{' '}
                      <span className="text-emerald-400 font-mono text-xs">({trip.bus?.busNumber})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium">{trip.driver?.name || 'Driver'}</td>
                    <td className="py-3.5 px-4 text-blue-400 font-medium">
                      {trip.route?.routeName || trip.route?.routeNumber || 'Transit Route'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          trip.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : trip.status === 'COMPLETED'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {trip.startTime ? new Date(trip.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Scheduled'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {trip.endTime ? new Date(trip.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
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

export default Trips;
