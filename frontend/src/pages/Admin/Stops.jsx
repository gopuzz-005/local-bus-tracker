import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const Stops = () => {
  const { t } = useLanguage();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const { data } = await api.get('/stops');
        setStops(data || []);
      } catch (err) {
        console.error('Error fetching admin stops:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStops();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span>🚏</span> {t("Stops")} Directory
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Registered transit stops, geographical waypoints, and district alignments.
        </p>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {loading ? (
          <p className="text-slate-400 p-8 text-center">Loading transit stops...</p>
        ) : stops.length === 0 ? (
          <p className="text-slate-400 p-8 text-center italic">No stops found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/70 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Stop Name</th>
                  <th className="py-3.5 px-4">District / Region</th>
                  <th className="py-3.5 px-4">Latitude</th>
                  <th className="py-3.5 px-4">Longitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {stops.map((stop) => (
                  <tr key={stop._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <span>🚏</span>
                      <span>{stop.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-blue-400 font-medium">
                      {stop.district?.name || 'Local District'} {stop.district?.state ? `(${stop.district.state})` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">{stop.latitude || '-'}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">{stop.longitude || '-'}</td>
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

export default Stops;
