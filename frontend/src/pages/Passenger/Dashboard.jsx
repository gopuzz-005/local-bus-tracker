import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useLocation, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import BusMarker from '../../components/Map/BusMarker';
import '../../styles/PassengerDashboard.css';
import 'leaflet/dist/leaflet.css';

// Component to dynamically center and smooth fly to location
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

// Default coordinates: Thiruvananthapuram Central Transit Hub
const TVM_COORDINATES = [8.4875, 76.9525];

const PassengerDashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const targetBusId = queryParams.get('busId');

  const [position, setPosition] = useState(TVM_COORDINATES);
  const [userLocation, setUserLocation] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(targetBusId || '');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const pollingRef = useRef(null);

  // 1. Fetch available buses list
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const { data } = await api.get('/buses');
        setAvailableBuses(data || []);

        // If no target bus was specified in URL, auto-select the first active or available bus
        if (!targetBusId && data && data.length > 0) {
          const active = data.find((b) => b.status === 'Active') || data[0];
          setSelectedBusId(active._id);
        }
      } catch (err) {
        console.error('Error fetching buses for tracker:', err);
      }
    };
    fetchBuses();
  }, [targetBusId]);

  // Sync selectedBusId with URL query change
  useEffect(() => {
    if (targetBusId) {
      setSelectedBusId(targetBusId);
    }
  }, [targetBusId]);

  // 2. Fetch tracking telemetry for current selected bus
  const fetchTracking = useCallback(async () => {
    if (!selectedBusId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get(`/tracking/buses/${selectedBusId}`);
      setTrackingData(data);

      const lat = data.liveLocation?.lat || data.liveLocation?.latitude || data.bus?.currentLocation?.lat;
      const lng = data.liveLocation?.lng || data.liveLocation?.longitude || data.bus?.currentLocation?.lng;

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng]);
      } else if (data.trip?.route?.routeCoordinates?.length > 0) {
        const firstCoord = data.trip.route.routeCoordinates[0];
        setPosition([firstCoord.latitude, firstCoord.longitude]);
      }
    } catch (err) {
      console.warn('Error fetching tracking data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBusId]);

  useEffect(() => {
    fetchTracking();

    // Polling fallback every 6 seconds to ensure data stays live even if socket drops
    pollingRef.current = setInterval(() => {
      fetchTracking();
    }, 6000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchTracking]);

  // 3. Socket.IO connection for real-time live GPS broadcast
  useEffect(() => {
    if (!selectedBusId) return;

    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('passengerJoin', selectedBusId);
    });

    socket.on('busLocation', (data) => {
      const lat = Number(data.lat || data.latitude);
      const lng = Number(data.lng || data.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng]);
        setTrackingData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            liveLocation: {
              latitude: lat,
              longitude: lng,
              lat,
              lng,
              timestamp: new Date()
            },
            status: data.status || 'LIVE',
            lastUpdated: new Date()
          };
        });
      }
    });

    socket.on('tripStatusChanged', (data) => {
      setTrackingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.status || prev.status,
          trip: data.trip || prev.trip
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedBusId]);

  // 4. Fetch Favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data } = await api.get('/favorites');
        setFavorites(data || []);
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };
    fetchFavorites();
  }, []);

  // 5. Geolocation for Passenger User
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
        },
        (err) => console.warn('User location notice:', err.message)
      );
    }
  }, []);

  const handleRemoveFavorite = async (id) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites(favorites.filter((fav) => fav._id !== id));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const busInfo = trackingData?.bus;
  const activeTrip = trackingData?.trip;
  const operatorName = trackingData?.operatorName || busInfo?.operator || 'Local Transit Operator';
  const driverName = trackingData?.driverName || 'Assigned Transit Driver';
  const trackingStatus = trackingData?.status || (busInfo?.status === 'Active' ? 'LIVE' : 'SCHEDULED');
  const route = activeTrip?.route || busInfo?.route;

  const currentLat = trackingData?.liveLocation?.latitude || trackingData?.liveLocation?.lat || busInfo?.currentLocation?.lat;
  const currentLng = trackingData?.liveLocation?.longitude || trackingData?.liveLocation?.lng || busInfo?.currentLocation?.lng;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>📍</span> Live Passenger Bus Tracker
          </h1>
          <p className="text-slate-300 mt-1">
            Real-time public transit tracking across Thiruvananthapuram and Kanyakumari.
          </p>
        </div>

        {/* Bus Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase font-bold text-slate-400 whitespace-nowrap">
            Select Bus to Track:
          </label>
          <select
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors font-medium"
          >
            {availableBuses.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.busNumber}) {b.status === 'Active' ? '• [LIVE]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Map + Telemetry Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2 bg-slate-800/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 h-[540px] overflow-hidden relative shadow-2xl">
          {!userLocation && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-slate-900/90 border border-slate-700 text-slate-300 px-4 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md">
              📍 Showing Kerala/Tamil Nadu Transit Corridor
            </div>
          )}

          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={position} />

            {/* Passenger User Location */}
            {userLocation && (
              <Marker position={userLocation}>
                <Popup>
                  <div className="text-xs font-sans font-bold">You are here</div>
                </Popup>
              </Marker>
            )}

            {/* Route Polyline Waypoints */}
            {route?.routeCoordinates && route.routeCoordinates.length > 0 && (
              <Polyline
                pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.85 }}
                positions={route.routeCoordinates.map((c) => [c.latitude, c.longitude])}
              />
            )}

            {/* Ordered Stop Markers along route */}
            {route?.orderedStops &&
              route.orderedStops.map((stop, sIdx) => {
                if (!stop.latitude || !stop.longitude) return null;
                return (
                  <Marker key={stop._id || sIdx} position={[stop.latitude, stop.longitude]}>
                    <Popup>
                      <div className="text-xs font-sans">
                        <p className="font-bold text-slate-800">{stop.name}</p>
                        <p className="text-slate-500">Stop #{sIdx + 1} on {route.routeNumber}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Live Bus Marker */}
            {currentLat && currentLng && (
              <BusMarker
                position={[currentLat, currentLng]}
                busInfo={{
                  name: busInfo?.name || 'Bus',
                  busNumber: busInfo?.busNumber || 'N/A',
                  status: trackingStatus,
                  nextStop: trackingData?.nextStopName
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Live Telemetry Card & Favorites */}
        <div className="space-y-6">
          {/* Active Bus Telemetry Card */}
          <div className="bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block">
                  Active Bus Telemetry
                </span>
                <h3 className="text-xl font-bold text-white">
                  {busInfo?.name || 'Loading Transit Vehicle...'}
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {busInfo?.busNumber || 'N/A'}
                </span>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  trackingStatus === 'LIVE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : trackingStatus === 'PAUSED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    trackingStatus === 'LIVE'
                      ? 'bg-emerald-400 animate-ping'
                      : 'bg-slate-400'
                  }`}
                ></span>
                {trackingStatus}
              </span>
            </div>

            <div className="py-4 space-y-3 text-sm border-b border-slate-700/80">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Operator:</span>
                <span className="font-bold text-white text-xs">{operatorName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Driver:</span>
                <span className="font-bold text-white text-xs">{driverName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Route Line:</span>
                <span className="font-bold text-blue-400 text-xs truncate max-w-[180px]">
                  {route?.routeName || route?.routeNumber || 'Transit Line'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Current / Next Stop:</span>
                <span className="font-bold text-emerald-400 text-xs truncate max-w-[180px]">
                  {trackingData?.nextStopName || 'In Transit'}
                </span>
              </div>

              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-slate-400">Coordinates:</span>
                <span className="text-slate-300">
                  {currentLat && currentLng
                    ? `${Number(currentLat).toFixed(4)}, ${Number(currentLng).toFixed(4)}`
                    : 'Awaiting signal'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Updated: {trackingData?.lastUpdated ? new Date(trackingData.lastUpdated).toLocaleTimeString() : 'Live'}</span>
              {busInfo?._id && (
                <Link
                  to={`/passenger/bus-details?busId=${busInfo._id}`}
                  className="text-blue-400 hover:text-blue-300 font-bold"
                >
                  Full Profile &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Passenger Favorites */}
          <div className="bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl text-left">
            <h2 className="text-base font-bold text-blue-400 mb-4 flex items-center gap-2">
              <span>⭐</span> Your Saved Routes & Stops
            </h2>
            <ul className="space-y-3">
              {favorites.map((fav) => (
                <li
                  key={fav._id}
                  className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 flex justify-between items-center"
                >
                  <div>
                    <span className="block font-bold text-blue-400 uppercase text-[10px] tracking-wider">
                      {fav.type}
                    </span>
                    <span className="block font-bold text-white text-xs">
                      {fav.referenceId?.routeName || fav.referenceId?.name || 'Saved Item'}
                      {fav.referenceId?.routeNumber && ` (${fav.referenceId.routeNumber})`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(fav._id)}
                    className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition-colors font-semibold text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {favorites.length === 0 && (
                <li className="text-slate-400 text-xs italic p-4 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                  No favorites saved yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDashboard;