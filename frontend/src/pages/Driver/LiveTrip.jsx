import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AuthContext from '../../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../../services/api';

const DriverLiveTrip = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);

  const [activeTrip, setActiveTrip] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [busIdInput, setBusIdInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentCoords, setCurrentCoords] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // Fetch active trip from backend source of truth
  const fetchActiveTrip = useCallback(async () => {
    try {
      setLoading(true);
      const [tripRes, busesRes, assignedBusRes] = await Promise.all([
        api.get('/trips/active'),
        api.get('/buses'),
        api.get('/buses/assigned')
      ]);

      setBuses(busesRes.data || []);

      if (tripRes.data?.active && tripRes.data?.trip) {
        const trip = tripRes.data.trip;
        setActiveTrip(trip);
        setSelectedBusId(trip.bus?._id || '');
        if (trip.bus?.currentLocation?.lat) {
          setCurrentCoords({
            lat: trip.bus.currentLocation.lat,
            lng: trip.bus.currentLocation.lng
          });
        }
      } else if (assignedBusRes.data?._id) {
        setSelectedBusId(assignedBusRes.data._id);
      }
    } catch (err) {
      console.error('Error fetching live trip:', err);
      setErrorMsg('Failed to fetch trip data from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveTrip();
  }, [fetchActiveTrip]);

  // Connect Socket.IO
  useEffect(() => {
    socketRef.current = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTrip?.bus?._id && socketRef.current) {
      socketRef.current.emit('driverJoin', activeTrip.bus._id);
    }
  }, [activeTrip]);

  // Broadcast location update
  const broadcastLocation = async (coords, stopIdx = null) => {
    if (!activeTrip?._id || !activeTrip?.bus?._id) return;
    setCurrentCoords(coords);

    if (socketRef.current) {
      socketRef.current.emit('locationUpdate', {
        busId: activeTrip.bus._id,
        tripId: activeTrip._id,
        lat: coords.lat,
        lng: coords.lng,
        status: activeTrip.status || 'LIVE'
      });
    }

    try {
      const payload = { lat: coords.lat, lng: coords.lng };
      const orderedStops = activeTrip.route?.orderedStops || [];
      if (stopIdx !== null && orderedStops.length > 0) {
        payload.currentStopId = orderedStops[stopIdx]?._id || orderedStops[stopIdx];
        if (stopIdx + 1 < orderedStops.length) {
          payload.nextStopId = orderedStops[stopIdx + 1]?._id || orderedStops[stopIdx + 1];
        }
      }
      await api.put(`/trips/${activeTrip._id}/location`, payload);
    } catch (err) {
      console.warn('API location update error:', err.message);
    }
  };

  // Start Trip
  const handleStartTrip = async (e) => {
    if (e) e.preventDefault();
    const busTarget = busIdInput.trim() || selectedBusId;
    if (!busTarget) {
      setErrorMsg('Please select or enter a Bus ID.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data } = await api.post('/trips/start', { busId: busTarget });
      setActiveTrip(data.trip);
      setSelectedBusId(data.trip.bus._id);
      setSuccessMsg(data.message || 'Trip started and broadcasting live!');

      if (data.trip.bus?.currentLocation?.lat) {
        const coords = { lat: data.trip.bus.currentLocation.lat, lng: data.trip.bus.currentLocation.lng };
        setCurrentCoords(coords);
        broadcastLocation(coords, 0);
      }

      // Start hardware GPS
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            broadcastLocation(coords);
          },
          (err) => console.warn('Geolocation warning:', err.message),
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      }
    } catch (err) {
      console.error('Start trip error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to start trip with specified Bus.');
    } finally {
      setActionLoading(false);
    }
  };

  // End Trip
  const handleEndTrip = async () => {
    if (!activeTrip?._id) return;
    if (!window.confirm('Are you sure you want to end this active trip?')) return;

    setActionLoading(true);
    try {
      await api.put(`/trips/${activeTrip._id}/end`);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setActiveTrip(null);
      setCurrentCoords(null);
      setSuccessMsg('Trip completed and ended successfully!');
    } catch (err) {
      console.error('End trip error:', err);
      setErrorMsg('Failed to end trip.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-white flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-slate-400">Loading live trip telemetry...</span>
        </div>
      </div>
    );
  }

  const selectedBus = buses.find((b) => b._id === selectedBusId) || activeTrip?.bus;
  const orderedStops = activeTrip?.route?.orderedStops || selectedBus?.route?.orderedStops || [];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span>📡</span> {t("Live Trip")}
        </h1>
        {activeTrip && (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Broadcasting Live
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-medium">
          {successMsg}
        </div>
      )}

      {!activeTrip ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 text-slate-300">
          <h2 className="text-xl font-bold text-white mb-2">No Active Trip in Progress</h2>
          <p className="text-slate-400 text-sm mb-6">
            Assign your bus and initiate GPS tracking to guide passengers along the route.
          </p>

          <form onSubmit={handleStartTrip} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-2">
                Select Fleet Bus
              </label>
              <select
                value={selectedBusId}
                onChange={(e) => {
                  setSelectedBusId(e.target.value);
                  setBusIdInput('');
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Assigned Bus --</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.busNumber}) - {b.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-2">
                Or Type Bus ID / Registration Number
              </label>
              <input
                type="text"
                placeholder="e.g. KL-01-AZ-1001"
                value={busIdInput}
                onChange={(e) => {
                  setBusIdInput(e.target.value);
                  if (e.target.value) setSelectedBusId('');
                }}
                className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || (!selectedBusId && !busIdInput.trim())}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {actionLoading ? 'Initializing Trip...' : 'Start Trip & Enable GPS Tracking'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 text-slate-300 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700">
            <div>
              <h2 className="text-2xl font-bold text-blue-400">
                {activeTrip.bus?.name || 'Bus'}{' '}
                <span className="text-white font-mono">({activeTrip.bus?.busNumber})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Driver: <span className="text-slate-200 font-semibold">{user?.name}</span> • Trip ID:{' '}
                <span className="font-mono text-slate-400">{activeTrip._id}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold block">Trip Started</span>
              <span className="text-white font-bold font-mono text-sm">
                {activeTrip.startTime ? new Date(activeTrip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">Status</p>
              <p className="font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {activeTrip.status || 'ACTIVE'}
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">Assigned Route</p>
              <p className="font-bold text-white truncate" title={activeTrip.route?.routeName}>
                {activeTrip.route?.routeName || 'Transit Route'}
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">Current Telemetry</p>
              <p className="font-mono text-xs text-slate-300 font-bold">
                {currentCoords
                  ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}`
                  : 'Acquiring GPS...'}
              </p>
            </div>
          </div>

          {/* Stops List */}
          {orderedStops.length > 0 && (
            <div>
              <h3 className="text-xs uppercase font-bold text-slate-400 mb-3 tracking-wider">
                Route Stops (Click to Advance Current Position):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {orderedStops.map((stop, sIdx) => {
                  const isCurrent = sIdx === currentStopIndex;
                  return (
                    <button
                      key={stop._id || sIdx}
                      onClick={() => {
                        setCurrentStopIndex(sIdx);
                        if (stop.latitude && stop.longitude) {
                          broadcastLocation({ lat: stop.latitude, lng: stop.longitude }, sIdx);
                        }
                      }}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        isCurrent
                          ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                          : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono text-slate-400">Stop {sIdx + 1}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm truncate">{stop.name || `Stop ${sIdx + 1}`}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleEndTrip}
            disabled={actionLoading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors shadow-lg shadow-rose-600/20"
          >
            {actionLoading ? 'Ending Trip...' : 'Stop Trip & Complete Tracking'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DriverLiveTrip;
