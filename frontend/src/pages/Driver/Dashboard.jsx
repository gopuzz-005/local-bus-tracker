import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { io } from 'socket.io-client';
import api from '../../services/api';

const DriverDashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  const [activeTrip, setActiveTrip] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [manualBusInput, setManualBusInput] = useState('');
  const [tripStatus, setTripStatus] = useState('NOT_STARTED'); // 'NOT_STARTED', 'ACTIVE', 'PAUSED'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const simIntervalRef = useRef(null);

  // 1. Initial Load: Fetch active trip and available buses
  const fetchActiveTripAndBuses = useCallback(async () => {
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
        setTripStatus(trip.status);
        setSelectedBusId(trip.bus?._id || '');
        if (trip.bus?.currentLocation?.lat) {
          setCurrentLocation({
            lat: trip.bus.currentLocation.lat,
            lng: trip.bus.currentLocation.lng
          });
        }
      } else if (assignedBusRes.data?._id) {
        setSelectedBusId(assignedBusRes.data._id);
      }
    } catch (err) {
      console.error('Error fetching driver active trip:', err);
      setMessage({
        text: 'Failed to synchronize with server. Please check your connection.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveTripAndBuses();
  }, [fetchActiveTripAndBuses]);

  // 2. Connect Socket.IO
  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (selectedBusId) {
        socket.emit('driverJoin', selectedBusId);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [selectedBusId]);

  // Join room when activeTrip bus changes
  useEffect(() => {
    if (activeTrip?.bus?._id && socketRef.current) {
      socketRef.current.emit('driverJoin', activeTrip.bus._id);
    }
  }, [activeTrip]);

  // Clean helper to broadcast location
  const broadcastLocation = useCallback(async (coords, stopIdx = null) => {
    if (!activeTrip?._id || !activeTrip?.bus?._id) return;

    setCurrentLocation(coords);

    // 1. Emit to Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('locationUpdate', {
        busId: activeTrip.bus._id,
        tripId: activeTrip._id,
        lat: coords.lat,
        lng: coords.lng,
        status: tripStatus === 'PAUSED' ? 'PAUSED' : 'LIVE'
      });
    }

    // 2. Persist to Backend API
    try {
      const payload = {
        lat: coords.lat,
        lng: coords.lng
      };

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
  }, [activeTrip, tripStatus]);

  // 3. Start Trip Action
  const handleStartTrip = async () => {
    const targetBusId = manualBusInput.trim() || selectedBusId;

    if (!targetBusId) {
      setMessage({ text: 'Please select or enter a valid Bus ID first.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data } = await api.post('/trips/start', { busId: targetBusId });

      setActiveTrip(data.trip);
      setTripStatus('ACTIVE');
      setSelectedBusId(data.trip.bus._id);
      setMessage({ text: data.message || 'Trip started successfully!', type: 'success' });

      // Join socket room
      if (socketRef.current) {
        socketRef.current.emit('driverJoin', data.trip.bus._id);
      }

      // Initial location from bus or route
      if (data.trip.bus?.currentLocation?.lat) {
        const initialCoords = {
          lat: data.trip.bus.currentLocation.lat,
          lng: data.trip.bus.currentLocation.lng
        };
        setCurrentLocation(initialCoords);
        broadcastLocation(initialCoords, 0);
      } else if (data.trip.route?.routeCoordinates?.length > 0) {
        const initialCoords = {
          lat: data.trip.route.routeCoordinates[0].latitude,
          lng: data.trip.route.routeCoordinates[0].longitude
        };
        setCurrentLocation(initialCoords);
        broadcastLocation(initialCoords, 0);
      }

      // Start hardware GPS tracking if supported
      startHardwareGps(data.trip.bus._id, data.trip._id);
    } catch (err) {
      console.error('Start trip error:', err);
      setMessage({
        text: err.response?.data?.message || 'Failed to start trip. Please verify the Bus ID.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Hardware GPS Tracker
  const startHardwareGps = (busId, tripId) => {
    if (!navigator.geolocation) return;

    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(coords);
        if (socketRef.current) {
          socketRef.current.emit('locationUpdate', {
            busId,
            tripId,
            lat: coords.lat,
            lng: coords.lng,
            status: 'LIVE'
          });
        }
      },
      (err) => console.warn('Geolocation sensor notice:', err.message),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  };

  // 4. Pause / Resume Trip
  const handleTogglePause = async () => {
    if (!activeTrip?._id) return;

    const newStatus = tripStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setActionLoading(true);

    try {
      const { data } = await api.put(`/trips/${activeTrip._id}/status`, { status: newStatus });
      setTripStatus(newStatus);
      setActiveTrip(data.trip);
      setMessage({
        text: `Trip ${newStatus === 'PAUSED' ? 'Paused' : 'Resumed'} successfully.`,
        type: 'info'
      });

      if (newStatus === 'PAUSED') {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        setIsSimulatingGps(false);
      } else {
        startHardwareGps(activeTrip.bus._id, activeTrip._id);
      }
    } catch (err) {
      console.error('Toggle pause error:', err);
      setMessage({ text: 'Failed to update trip status.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // 5. End Trip Action
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
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }

      setTripStatus('NOT_STARTED');
      setActiveTrip(null);
      setCurrentLocation(null);
      setIsSimulatingGps(false);
      setMessage({ text: 'Trip completed and ended successfully!', type: 'success' });
    } catch (err) {
      console.error('End trip error:', err);
      setMessage({ text: 'Failed to end trip.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Simulated Route GPS Driver for demo testing
  const toggleGpsSimulation = () => {
    if (isSimulatingGps) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
      setIsSimulatingGps(false);
      setMessage({ text: 'Route simulation paused.', type: 'info' });
      return;
    }

    const coordsList = activeTrip?.route?.routeCoordinates || [];
    if (!coordsList.length) {
      setMessage({ text: 'No coordinate waypoints available on this route.', type: 'error' });
      return;
    }

    setIsSimulatingGps(true);
    setMessage({ text: 'Simulated Route GPS active (broadcasting realistic demo coordinates).', type: 'info' });

    let idx = 0;
    simIntervalRef.current = setInterval(() => {
      if (idx >= coordsList.length) idx = 0;
      const point = coordsList[idx];
      const newCoords = { lat: point.latitude, lng: point.longitude };

      const orderedStops = activeTrip.route?.orderedStops || [];
      const stopIdx = Math.min(idx, orderedStops.length - 1);
      setCurrentStopIndex(stopIdx);

      broadcastLocation(newCoords, stopIdx);
      idx++;
    }, 4000);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-white flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-slate-300">Synchronizing driver trip details...</span>
        </div>
      </div>
    );
  }

  const selectedBus = buses.find((b) => b._id === selectedBusId) || activeTrip?.bus;
  const orderedStops = activeTrip?.route?.orderedStops || selectedBus?.route?.orderedStops || [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>🚌</span> Driver Operational Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Logged in as <span className="text-blue-400 font-semibold">{user?.name}</span> ({user?.email})
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              tripStatus === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : tripStatus === 'PAUSED'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-slate-700 text-slate-300 border border-slate-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                tripStatus === 'ACTIVE'
                  ? 'bg-emerald-400 animate-pulse'
                  : tripStatus === 'PAUSED'
                  ? 'bg-amber-400'
                  : 'bg-slate-400'
              }`}
            ></span>
            {tripStatus === 'ACTIVE' ? 'Trip Live' : tripStatus === 'PAUSED' ? 'Trip Paused' : 'No Active Trip'}
          </span>
        </div>
      </div>

      {/* Notification Banner */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between ${
            message.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-white text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ACTIVE TRIP DETAILS PANEL */}
      {activeTrip && (
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-blue-500/30 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-700/80 gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-blue-400 block mb-1">
                Active Live Trip Assigned
              </span>
              <h2 className="text-2xl font-bold text-white">
                {activeTrip.bus?.name || 'Assigned Bus'}{' '}
                <span className="text-emerald-400 font-mono ml-1">
                  ({activeTrip.bus?.busNumber || 'N/A'})
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Trip ID: <span className="text-slate-300">{activeTrip._id}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {tripStatus === 'ACTIVE' && (
                <button
                  onClick={toggleGpsSimulation}
                  className={`text-xs px-3 py-2 rounded-lg font-bold border transition-colors flex items-center gap-1.5 ${
                    isSimulatingGps
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                      : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                  title="Simulate vehicle moving along coordinates"
                >
                  <span>📍</span>
                  {isSimulatingGps ? 'Pause Demo Route GPS' : 'Simulate Demo GPS'}
                </button>
              )}
            </div>
          </div>

          {/* Grid of Trip Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-700/80">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Driver Name
              </span>
              <span className="text-white font-bold text-sm block">
                {activeTrip.driver?.name || user?.name || 'Driver'}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Bus Type
              </span>
              <span className="text-blue-300 font-bold text-sm block">
                {activeTrip.bus?.type || 'Standard'}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Route Code & Name
              </span>
              <span className="text-white font-bold text-sm block truncate" title={activeTrip.route?.routeName}>
                {activeTrip.route?.routeNumber || 'R-01'} - {activeTrip.route?.routeName || 'Assigned Route'}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Start Time
              </span>
              <span className="text-white font-bold text-sm block font-mono">
                {activeTrip.startTime ? new Date(activeTrip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Route Origin
              </span>
              <span className="text-slate-200 font-medium text-sm block truncate">
                {activeTrip.route?.source?.name || orderedStops[0]?.name || 'Origin Terminal'}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Route Destination
              </span>
              <span className="text-slate-200 font-medium text-sm block truncate">
                {activeTrip.route?.destination?.name || orderedStops[orderedStops.length - 1]?.name || 'Destination Terminal'}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Current / Next Stop
              </span>
              <span className="text-emerald-400 font-medium text-sm block truncate">
                {orderedStops[currentStopIndex]?.name || activeTrip.nextStop?.name || 'In Transit'}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Passenger Visibility
              </span>
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Broadcasting to Public
              </span>
            </div>
          </div>

          {/* GPS Coordinate Display */}
          <div className="py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                📡
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Live GPS Location Coordinates:</span>
                <span className="text-slate-200 font-mono font-bold">
                  {currentLocation
                    ? `Lat: ${currentLocation.lat.toFixed(5)}, Lng: ${currentLocation.lng.toFixed(5)}`
                    : 'Awaiting first location telemetry...'}
                </span>
              </div>
            </div>

            {isSimulatingGps && (
              <span className="text-purple-400 font-medium bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs">
                Simulated demo coordinates active (Thiruvananthapuram)
              </span>
            )}
          </div>

          {/* Ordered Stops Navigator */}
          {orderedStops.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/80">
              <h4 className="text-xs uppercase font-bold text-slate-400 mb-3 tracking-wider">
                Ordered Stops Along Route:
              </h4>
              <div className="flex flex-wrap gap-2">
                {orderedStops.map((stop, sIdx) => {
                  const isCurrent = sIdx === currentStopIndex;
                  const isPassed = sIdx < currentStopIndex;
                  return (
                    <button
                      key={stop._id || sIdx}
                      onClick={() => {
                        setCurrentStopIndex(sIdx);
                        if (stop.latitude && stop.longitude) {
                          broadcastLocation({ lat: stop.latitude, lng: stop.longitude }, sIdx);
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30'
                          : isPassed
                          ? 'bg-slate-900/60 text-slate-400 border-slate-700 line-through'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-slate-400">{sIdx + 1}.</span>
                      <span>{stop.name || `Stop ${sIdx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons: Pause / Resume & End Trip */}
          <div className="mt-6 pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleTogglePause}
              disabled={actionLoading}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                tripStatus === 'ACTIVE'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <span>{tripStatus === 'ACTIVE' ? '⏸️' : '▶️'}</span>
              <span>{tripStatus === 'ACTIVE' ? 'Pause Active Trip' : 'Resume Trip'}</span>
            </button>

            <button
              onClick={handleEndTrip}
              disabled={actionLoading}
              className="flex-1 py-3 px-6 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
            >
              <span>⏹️</span>
              <span>Complete & End Trip</span>
            </button>
          </div>
        </div>
      )}

      {/* START TRIP SETUP CARD (When no active trip) */}
      {!activeTrip && (
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span>🚀</span> Start a New Live Trip
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Select your assigned bus or enter your Bus ID. Starting a trip persists it to the database and broadcasts live location tracking to waiting passengers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Bus Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Select Assigned Bus
              </label>
              <select
                value={selectedBusId}
                onChange={(e) => {
                  setSelectedBusId(e.target.value);
                  setManualBusInput('');
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">-- Choose a Bus from Fleet --</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.busNumber}) - {b.type} {b.route ? `[${b.route.routeName || b.route.routeNumber}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Manual Bus ID Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Or Enter Bus ID / Registration Number
              </label>
              <input
                type="text"
                placeholder="e.g. KL-01-AZ-1001 or MongoDB ObjectId"
                value={manualBusInput}
                onChange={(e) => {
                  setManualBusInput(e.target.value);
                  if (e.target.value) setSelectedBusId('');
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Preview of Selected Bus */}
          {selectedBus && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 mb-6 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="font-bold text-white text-base">{selectedBus.name}</span>
                <span className="text-emerald-400 font-mono ml-2">({selectedBus.busNumber})</span>
                <span className="text-slate-400 block text-xs mt-0.5">
                  Type: {selectedBus.type} • Operator: {selectedBus.operator || 'Fleet'} • District: {selectedBus.district?.name || 'Local'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Assigned Route:</span>
                <span className="text-blue-400 font-semibold text-xs block">
                  {selectedBus.route?.routeName || selectedBus.route?.routeNumber || 'Default Transit Line'}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleStartTrip}
            disabled={actionLoading || (!selectedBusId && !manualBusInput.trim())}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-base"
          >
            {actionLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Validating Bus & Starting Trip...</span>
              </>
            ) : (
              <>
                <span>▶️</span>
                <span>Start Trip & Broadcast GPS</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Driver Guidelines Card */}
      <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-5 text-xs text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-300 text-sm">💡 Operational Instructions:</h4>
        <p>• Your active trip is persisted continuously on the server. Navigating between pages or refreshing will automatically preserve your active trip.</p>
        <p>• Clicking "Pause Trip" suspends tracking alerts for passengers while keeping your bus assignment locked.</p>
        <p>• Only click "Complete & End Trip" when you have reached your final destination terminal.</p>
      </div>
    </div>
  );
};

export default DriverDashboard;