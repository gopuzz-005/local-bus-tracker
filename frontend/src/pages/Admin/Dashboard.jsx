import React, { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [districts, setDistricts] = useState([]);
  const [newDistrict, setNewDistrict] = useState({ name: '', state: '', code: '' });
  
  const [stops, setStops] = useState([]);
  const [newStop, setNewStop] = useState({ name: '', district: '', latitude: '', longitude: '' });

  const [routes, setRoutes] = useState([]);
  const [stats, setStats] = useState({ totalBuses: 0, totalRoutes: 0, totalDrivers: 0, totalPassengers: 0 });
  const [newRoute, setNewRoute] = useState({ routeName: '', routeNumber: '', district: '', source: '', destination: '' });

  
  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats', error);
    }
  };
    
  const fetchDistricts = async () => {
    try {
      const { data } = await api.get('/districts');
      setDistricts(data);
    } catch (error) {
      console.error('Error fetching districts', error);
    }
  };

  const fetchStops = async () => {
    try {
      const { data } = await api.get('/stops');
      setStops(data);
    } catch (error) {
      console.error('Error fetching stops', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const { data } = await api.get('/routes');
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes', error);
    }
  };

  useEffect(() => {
    fetchDistricts();
    fetchStops();
    fetchRoutes();
    fetchStats();
  }, []);

  const handleCreateDistrict = async (e) => {
    e.preventDefault();
    try {
      await api.post('/districts', newDistrict);
      setNewDistrict({ name: '', state: '', code: '' });
      fetchDistricts();
    } catch (error) {
      console.error('Error creating district', error);
      alert(error.response?.data?.message || 'Error creating district');
    }
  };

  const handleDeleteDistrict = async (id) => {
    if (!window.confirm("Are you sure you want to delete this district?")) return;
    try {
      await api.delete(`/districts/${id}`);
      fetchDistricts();
    } catch (error) {
      console.error('Error deleting district', error);
      alert('Error deleting district');
    }
  };

  const handleCreateStop = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stops', newStop);
      setNewStop({ name: '', district: '', latitude: '', longitude: '' });
      fetchStops();
    } catch (error) {
      console.error('Error creating stop', error);
      alert(error.response?.data?.message || 'Error creating stop');
    }
  };

  const handleDeleteStop = async (id) => {
    if (!window.confirm("Are you sure you want to delete this stop?")) return;
    try {
      await api.delete(`/stops/${id}`);
      fetchStops();
    } catch (error) {
      console.error('Error deleting stop', error);
      alert('Error deleting stop');
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/routes', newRoute);
      setNewRoute({ routeName: '', routeNumber: '', district: '', source: '', destination: '' });
      fetchRoutes();
    } catch (error) {
      console.error('Error creating route', error);
      alert(error.response?.data?.message || 'Error creating route');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm("Are you sure you want to delete this route?")) return;
    try {
      await api.delete(`/routes/${id}`);
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route', error);
      alert('Error deleting route');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-welcome">
          Welcome back, <span className="user-name">{user?.name || 'Admin'}</span>. Here is an overview of the system.
        </p>
      </header>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="stat-label">Total Buses</h3>
          <p className="stat-number text-blue">{stats.totalBuses}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-label">Active Routes</h3>
          <p className="stat-number text-emerald">{stats.totalRoutes}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-label">Total Drivers</h3>
          <p className="stat-number text-purple">{stats.totalDrivers}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-label">Passengers Active</h3>
          <p className="stat-number text-amber">{stats.totalPassengers}</p>
        </div>
      </div>

      <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 mt-8 text-left">
        <h2 className="text-xl font-bold text-white mb-4">Manage Districts</h2>
        
        <form onSubmit={handleCreateDistrict} className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" placeholder="District Name (e.g. Kanyakumari)" required
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newDistrict.name} onChange={(e) => setNewDistrict({...newDistrict, name: e.target.value})}
          />
          <input 
            type="text" placeholder="State (e.g. Tamil Nadu)" required
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newDistrict.state} onChange={(e) => setNewDistrict({...newDistrict, state: e.target.value})}
          />
          <input 
            type="text" placeholder="Code (e.g. TN-74)"
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newDistrict.code} onChange={(e) => setNewDistrict({...newDistrict, code: e.target.value})}
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold transition-colors">Add</button>
        </form>

        <div className="space-y-3">
          {districts.map(dist => (
            <div key={dist._id} className="flex justify-between items-center bg-slate-700/40 border border-slate-600 p-4 rounded-lg shadow-sm">
              <span className="text-slate-200 font-medium">{dist.name}, {dist.state} <span className="text-slate-400 text-sm ml-2">({dist.code})</span></span>
              <button onClick={() => handleDeleteDistrict(dist._id)} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1 rounded transition-colors font-semibold text-sm">Delete</button>
            </div>
          ))}
          {districts.length === 0 && <p className="text-slate-400 italic">No districts found. Add your first supported district above.</p>}
        </div>
      </div>

      <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 mt-8 text-left">
        <h2 className="text-xl font-bold text-white mb-4">Manage Stops</h2>
        
        <form onSubmit={handleCreateStop} className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" placeholder="Stop Name (e.g. Central Station)" required
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newStop.name} onChange={(e) => setNewStop({...newStop, name: e.target.value})}
          />
          <select 
            required
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newStop.district} onChange={(e) => setNewStop({...newStop, district: e.target.value})}
          >
            <option value="">Select District</option>
            {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input 
            type="number" step="any" placeholder="Latitude" required
            className="w-32 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newStop.latitude} onChange={(e) => setNewStop({...newStop, latitude: e.target.value})}
          />
          <input 
            type="number" step="any" placeholder="Longitude" required
            className="w-32 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newStop.longitude} onChange={(e) => setNewStop({...newStop, longitude: e.target.value})}
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold transition-colors">Add</button>
        </form>

        <div className="space-y-3">
          {stops.map(stop => (
            <div key={stop._id} className="flex justify-between items-center bg-slate-700/40 border border-slate-600 p-4 rounded-lg shadow-sm">
              <div>
                <span className="text-slate-200 font-medium">{stop.name} <span className="text-slate-400 text-sm ml-2">({stop.district?.name})</span></span>
                <span className="block text-slate-500 text-xs mt-1">Lat: {stop.latitude}, Lng: {stop.longitude}</span>
              </div>
              <button onClick={() => handleDeleteStop(stop._id)} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1 rounded transition-colors font-semibold text-sm">Delete</button>
            </div>
          ))}
          {stops.length === 0 && <p className="text-slate-400 italic">No stops found.</p>}
        </div>
      </div>

      <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 mt-8 text-left">
        <h2 className="text-xl font-bold text-white mb-4">Manage Routes</h2>
        
        <form onSubmit={handleCreateRoute} className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" placeholder="Route Name (e.g. City Express)" required
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newRoute.routeName} onChange={(e) => setNewRoute({...newRoute, routeName: e.target.value})}
          />
          <input 
            type="text" placeholder="Route Number" required
            className="w-32 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newRoute.routeNumber} onChange={(e) => setNewRoute({...newRoute, routeNumber: e.target.value})}
          />
          <select 
            required
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newRoute.district} onChange={(e) => setNewRoute({...newRoute, district: e.target.value})}
          >
            <option value="">Select District</option>
            {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select 
            required
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newRoute.source} onChange={(e) => setNewRoute({...newRoute, source: e.target.value})}
          >
            <option value="">Source Stop</option>
            {stops.filter(s => s.district?._id === newRoute.district || s.district === newRoute.district).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select 
            required
            className="flex-1 bg-slate-900 border border-slate-600 text-white p-2.5 rounded-lg outline-none focus:border-blue-500"
            value={newRoute.destination} onChange={(e) => setNewRoute({...newRoute, destination: e.target.value})}
          >
            <option value="">Destination Stop</option>
            {stops.filter(s => s.district?._id === newRoute.district || s.district === newRoute.district).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold transition-colors">Add</button>
        </form>

        <div className="space-y-3">
          {routes.map(route => (
            <div key={route._id} className="flex justify-between items-center bg-slate-700/40 border border-slate-600 p-4 rounded-lg shadow-sm">
              <div>
                <span className="text-slate-200 font-medium">{route.routeName} <span className="text-blue-400 font-bold ml-2">{route.routeNumber}</span></span>
                <span className="block text-slate-500 text-sm mt-1">{route.source?.name} ➔ {route.destination?.name} <span className="text-xs ml-2 italic">({route.district?.name})</span></span>
              </div>
              <button onClick={() => handleDeleteRoute(route._id)} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1 rounded transition-colors font-semibold text-sm">Delete</button>
            </div>
          ))}
          {routes.length === 0 && <p className="text-slate-400 italic">No routes found.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;