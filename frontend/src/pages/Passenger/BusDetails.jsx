import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const BusDetails = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId');
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/buses/${busId}`);
        setBus(data);
      } catch (error) {
        console.error("Error fetching bus details", error);
        setErrorMsg("Failed to load bus details. Please verify the bus selection.");
      } finally {
        setLoading(false);
      }
    };

    if (busId) {
      fetchBusDetails();
    } else {
      setErrorMsg("No bus ID was specified.");
      setLoading(false);
    }
  }, [busId]);

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-white flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-slate-400">Loading bus profile...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-400 hover:text-blue-300 font-medium">
          &larr; Back to Search
        </button>
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-6 rounded-xl">
          <p className="font-bold">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-white">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-400 hover:text-blue-300">
          &larr; Back to Search
        </button>
        <p>Bus record not found.</p>
      </div>
    );
  }

  const operatorName = bus.operatorName || bus.operator || bus.currentDriver?.name || bus.driver?.name || 'Local Fleet Operator';
  const driverName = bus.driverName || bus.activeTrip?.driver?.name || bus.currentDriver?.name || bus.driver?.name || 'Assigned Driver';
  const isTripActive = bus.activeTrip && (bus.activeTrip.status === 'ACTIVE' || bus.activeTrip.status === 'PAUSED');
  const tripStatus = isTripActive ? (bus.activeTrip.status === 'PAUSED' ? 'Paused' : 'LIVE Broadcast Active') : (bus.status || 'Active');
  const orderedStops = bus.route?.orderedStops || [];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 text-sm">
          <span>&larr;</span> Back to Search
        </button>
        
        <Link
          to={`/passenger/dashboard?busId=${bus._id}`}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
        >
          <span>📍</span> Track Live On Map
        </Link>
      </div>

      <div className="bg-slate-800/90 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-slate-700 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-700/80 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{bus.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold">
                {bus.busNumber}
              </span>
              <span className="text-slate-400 text-xs">
                {bus.district?.name ? `Region: ${bus.district.name}` : 'City Transit'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isTripActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isTripActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
              {tripStatus}
            </span>
          </div>
        </div>

        {/* Core Bus Properties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-700/80 text-left">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs text-slate-400 uppercase font-semibold mb-1">Service Type</h3>
            <p className="text-base font-bold text-blue-400">{bus.type || 'Ordinary'}</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs text-slate-400 uppercase font-semibold mb-1">Fleet Operator</h3>
            <p className="text-base font-bold text-white">{operatorName}</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs text-slate-400 uppercase font-semibold mb-1">Assigned Driver</h3>
            <p className="text-base font-bold text-white">{driverName}</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs text-slate-400 uppercase font-semibold mb-1">Current Coordinates</h3>
            <p className="text-xs font-mono font-bold text-slate-300 mt-1">
              {bus.currentLocation?.lat && bus.currentLocation?.lng
                ? `${bus.currentLocation.lat.toFixed(4)}, ${bus.currentLocation.lng.toFixed(4)}`
                : 'Simulated en route'}
            </p>
          </div>
        </div>

        {/* Route Details Card */}
        {bus.route && (
          <div className="mt-6 bg-slate-900/50 p-6 rounded-xl border border-slate-700/80 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/60 gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🗺️</span> {bus.route.routeName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Route Code: <span className="font-mono text-blue-400 font-bold">{bus.route.routeNumber}</span></p>
              </div>

              {(bus.route.source?.name || bus.route.destination?.name) && (
                <div className="text-xs text-slate-300 font-medium">
                  {bus.route.source?.name || 'Origin'} ➔ {bus.route.destination?.name || 'Destination'}
                </div>
              )}
            </div>

            {/* Ordered Stops Along Route */}
            {orderedStops.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-3 tracking-wider">
                  Ordered Stops Along This Line:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {orderedStops.map((stop, idx) => (
                    <div
                      key={stop._id || idx}
                      className="bg-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5"
                    >
                      <span className="text-[10px] text-blue-400 font-mono font-bold">{idx + 1}.</span>
                      <span>{stop.name || `Stop ${idx + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Track on Map */}
        <div className="mt-8 pt-4 flex justify-end">
          <Link
            to={`/passenger/dashboard?busId=${bus._id}`}
            className="w-full sm:w-auto text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 text-sm"
          >
            <span>📍</span> Launch Live Map Tracking For This Bus
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BusDetails;
