import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const BusFinder = () => {
  const { t } = useLanguage();
  const [districts, setDistricts] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [startingStop, setStartingStop] = useState("");
  const [destinationStop, setDestinationStop] = useState("");
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchDistrictsAndStops = async () => {
      try {
        const [distRes, stopRes] = await Promise.all([
          api.get('/districts'),
          api.get('/stops')
        ]);
        setDistricts(distRes.data);
        setStops(stopRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data", error);
        setLoading(false);
      }
    };
    fetchDistrictsAndStops();
    
    // Load recent searches
    const saved = localStorage.getItem('busRecentSearches');
    if(saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const handleSearch = async () => {
    if (!selectedDistrict) {
      setErrorMsg("Please select a district.");
      return;
    }
    if (!startingStop) {
      setErrorMsg("Please select a starting stop.");
      return;
    }
    if (!destinationStop) {
      setErrorMsg("Please select a destination stop.");
      return;
    }
    if (startingStop === destinationStop) {
      setErrorMsg("Starting stop and Destination cannot be the same.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    
    if (startingStop && destinationStop) {
      const newSearch = { district: selectedDistrict, start: startingStop, dest: destinationStop, timestamp: Date.now() };
      const updatedSearches = [newSearch, ...recentSearches.filter(s => s.start !== newSearch.start || s.dest !== newSearch.dest)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('busRecentSearches', JSON.stringify(updatedSearches));
    }

    try {
      const { data } = await api.get('/buses', {
        params: { 
          districtName: selectedDistrict,
          startStop: startingStop,
          destinationStop: destinationStop
        }
      });
      // Simple filtering: in a real app, this should check route orderedStops.
      // For this demo, we just pass the buses through since the backend route is basic.
      setFilteredBuses(data);
      setHasSearched(true);
    } catch (error) {
      console.error("Error searching buses", error);
      setErrorMsg("Error connecting to server.");
    }
    setLoading(false);
  };

  const findNearbyStops = () => {
    const fallbackLocation = () => {
      // If geolocation fails (e.g. no https or denied), fallback to a mock central location
      const lat = 8.0883; // Example: Kanyakumari roughly
      const lon = 77.5385;
      
      const calculatedStops = stops.map(stop => {
        const dLat = (stop.latitude - lat) * Math.PI / 180;
        const dLon = (stop.longitude - lon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(stop.latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); // in km
        return { ...stop, distance };
      }).filter(s => s.latitude && s.longitude).sort((a,b) => a.distance - b.distance).slice(0, 5);
      
      setNearbyStops(calculatedStops);
      setErrorMsg("Using approximate location since Geolocation is unavailable.");
    };

    if (!navigator.geolocation) {
      fallbackLocation();
      return;
    }
    
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      const calculatedStops = stops.map(stop => {
        const dLat = (stop.latitude - lat) * Math.PI / 180;
        const dLon = (stop.longitude - lon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(stop.latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); // in km
        return { ...stop, distance };
      }).filter(s => s.latitude && s.longitude).sort((a,b) => a.distance - b.distance).slice(0, 5);
      
      setNearbyStops(calculatedStops);
      setErrorMsg(""); // Clear errors if successful
    }, (err) => {
      console.warn("Geolocation error:", err.message);
      fallbackLocation();
    }, { timeout: 10000 });
  };

  // Filter stops by selected district
  const availableStops = stops.filter(s => s.district?.name === selectedDistrict);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-white">{t("Find Bus")}</h1>
        <button onClick={findNearbyStops} className="text-sm bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30">
          📍 {t("Nearby Stops")}
        </button>
      </div>
      <p className="text-slate-400 mb-8">Select your region and stops to see live bus availability.</p>

      {errorMsg && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 border border-red-500/30">{errorMsg}</div>}

      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-white">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">District</label>
          <select 
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-blue-500"
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setStartingStop("");
              setDestinationStop("");
            }}
          >
            <option value="">-- Choose --</option>
            {districts.map(dist => <option key={dist._id} value={dist.name}>{dist.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">{t("Starting Stop")}</label>
          <select 
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 disabled:opacity-50"
            value={startingStop}
            onChange={(e) => setStartingStop(e.target.value)}
            disabled={!selectedDistrict}
          >
            <option value="">-- Start --</option>
            {availableStops.map(stop => <option key={stop._id} value={stop._id}>{stop.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">{t("Destination")}</label>
          <select 
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 disabled:opacity-50"
            value={destinationStop}
            onChange={(e) => setDestinationStop(e.target.value)}
            disabled={!selectedDistrict}
          >
            <option value="">-- End --</option>
            {availableStops.map(stop => <option key={stop._id} value={stop._id}>{stop.name}</option>)}
          </select>
        </div>

        <button 
          onClick={handleSearch}
          disabled={!selectedDistrict}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-2.5 rounded-lg transition-colors w-full"
        >
          {loading ? "Searching..." : t("Find Bus")}
        </button>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-400 mb-2">Recent Searches:</h4>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s, idx) => {
              const startName = stops.find(st => st._id === s.start)?.name || s.start;
              const destName = stops.find(st => st._id === s.dest)?.name || s.dest;
              return (
                <button 
                  key={idx} 
                  onClick={() => {
                    if(s.district) setSelectedDistrict(s.district);
                    setTimeout(() => {
                      setStartingStop(s.start);
                      setDestinationStop(s.dest);
                    }, 0);
                  }}
                  className="bg-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-700 border border-slate-600"
                >
                  {startName} &rarr; {destName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nearby Stops Display */}
      {nearbyStops.length > 0 && (
        <div className="mt-8 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">Nearby Stops</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {nearbyStops.map(stop => (
              <div key={stop._id} className="bg-slate-900 p-4 rounded-lg border border-slate-600 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-blue-400">{stop.name}</h4>
                  <p className="text-xs text-slate-400">{stop.district?.name}</p>
                </div>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-emerald-400 font-mono">
                  {stop.distance.toFixed(1)} km
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        {hasSearched ? (
          filteredBuses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuses.map(bus => (
                <div key={bus._id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{bus.name}</h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">
                      {bus.busNumber}
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm space-y-1.5 mb-4 text-left">
                    <p className="text-slate-300">📍 Region: <span className="text-white font-medium">{bus.district?.name || 'Local'}</span></p>
                    <p className="text-slate-300">🏢 Operator: <span className="text-white font-medium">{bus.operator || bus.currentDriver?.name || bus.driver?.name || 'Local Transit'}</span></p>
                    <p className="text-slate-300">🚌 Type: <span className="text-blue-400 font-medium">{bus.type || 'Standard'}</span></p>
                    {bus.route && (
                      <p className="text-xs text-slate-400 truncate">
                        Line: <span className="text-emerald-400 font-medium">{bus.route.routeName || bus.route.routeNumber}</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Share Route */}
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Track this bus',
                          text: `Track ${bus.name} (${bus.busNumber}) on Local Bus Tracker!`
                        }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(`Track ${bus.name} (${bus.busNumber})`);
                        alert("Route info copied to clipboard!");
                      }
                    }}
                    className="w-full mb-3 bg-slate-700 hover:bg-slate-600 text-slate-300 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    🔗 {t("Share Route")}
                  </button>

                  <div className="flex gap-2">
                    <Link 
                      to={`/passenger/dashboard?busId=${bus._id}`} 
                      className="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs transition-colors font-bold shadow-md shadow-blue-600/30"
                    >
                      📍 Track on Map
                    </Link>
                    <Link 
                      to={`/passenger/bus-details?busId=${bus._id}&start=${startingStop}&dest=${destinationStop}`} 
                      className="flex-1 text-center bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-lg text-xs transition-colors font-semibold"
                    >
                      Bus Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-400">
              No buses found matching your criteria.
            </div>
          )
        ) : (
          <div className="text-center py-12 text-slate-500 italic">
            Select your journey details above to see results.
          </div>
        )}
      </div>
    </div>
  );
};

export default BusFinder;