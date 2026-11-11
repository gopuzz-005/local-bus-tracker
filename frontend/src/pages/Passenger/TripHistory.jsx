import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import AuthContext from '../../context/AuthContext';

const TripHistory = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data } = await api.get('/trips');
        // Simple client-side filtering if user is driver
        const userTrips = user.role === 'Driver' 
          ? data.filter(trip => trip.driver?._id === user._id || trip.driver === user._id)
          : data; // For passenger, we might just show completed trips they tracked, but for simple demo show all or limit.
        
        setTrips(userTrips);
      } catch (error) {
        console.error("Error fetching trips", error);
      }
      setLoading(false);
    };
    fetchTrips();
  }, [user]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">{t("Trip History")}</h1>
      
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : trips.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-6 py-3">Bus</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Start Time</th>
                <th className="px-6 py-3">End Time</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip._id} className="border-b border-slate-700 hover:bg-slate-800/30">
                  <td className="px-6 py-4">{trip.bus?.name || trip.bus}</td>
                  <td className="px-6 py-4">{trip.route?.routeName || trip.route}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${trip.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700'}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{trip.startTime ? new Date(trip.startTime).toLocaleString() : '-'}</td>
                  <td className="px-6 py-4">{trip.endTime ? new Date(trip.endTime).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-400">
          No previous trips.
        </div>
      )}
    </div>
  );
};

export default TripHistory;
