import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './context/AuthContext';

// --- Authentication Pages ---
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminLogin from './pages/Admin/AdminLogin.jsx';
import AdminRegister from './pages/Admin/AdminRegister.jsx';

// --- Admin Pages ---
import AdminDashboard from './pages/Admin/Dashboard.jsx';
import AdminBuses from './pages/Admin/Buses.jsx';
import AdminDrivers from './pages/Admin/Drivers.jsx';
import AdminRoutes from './pages/Admin/Routes.jsx';
import AdminStops from './pages/Admin/Stops.jsx';
import AdminUsers from './pages/Admin/Users.jsx';
import AdminTrips from './pages/Admin/Trips.jsx';
import AdminAlerts from './pages/Admin/Alerts.jsx';
import AdminNotifications from './pages/Admin/Notifications.jsx';
import AdminSettings from './pages/Admin/Settings.jsx';

// --- Driver Pages ---
import DriverDashboard from './pages/Driver/Dashboard.jsx';
import DriverLiveTrip from './pages/Driver/LiveTrip.jsx';
import DriverHistory from './pages/Driver/History.jsx';
import DriverProfile from './pages/Driver/Profile.jsx';

// --- Passenger Pages ---
import PassengerDashboard from './pages/Passenger/Dashboard.jsx';
import BusFinder from './pages/Passenger/BusFinder.jsx';
import BusDetails from './pages/Passenger/BusDetails.jsx';
import Alerts from './pages/Passenger/Alerts.jsx';
import Notifications from './pages/Passenger/Notifications.jsx';
import TripHistory from './pages/Passenger/TripHistory.jsx';

// --- Shared Components ---
import Sidebar from './components/Sidebar.jsx';
import TopHeader from './components/TopHeader.jsx';

// ==========================================
// Protected Route Wrapper Component
// ==========================================
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-white bg-slate-900">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || '').toLowerCase();

  if (allowedRoles && !allowedRoles.map((r) => r.toLowerCase()).includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen md:ml-64 bg-slate-900/90 relative overflow-hidden">
        <TopHeader />
        <div className="flex-1 overflow-y-auto relative">
          <div className="absolute inset-0 bg-app-theme bg-cover bg-center opacity-20 -z-10 pointer-events-none animated-bg-image"></div>
          {children}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Role-Based Redirector Component
// ==========================================
const RoleBasedRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-white bg-slate-900">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').toLowerCase();

  switch (role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'driver':
      return <Navigate to="/driver/dashboard" replace />;
    case 'passenger':
      return <Navigate to="/passenger/find-bus" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// ==========================================
// Main App Component
// ==========================================
function App() {
  return (
    <Router>
      <Routes>
        {/* Public & Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* --- Admin Protected Routes --- */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/buses" element={<ProtectedRoute allowedRoles={['Admin']}><AdminBuses /></ProtectedRoute>} />
        <Route path="/admin/drivers" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDrivers /></ProtectedRoute>} />
        <Route path="/admin/routes" element={<ProtectedRoute allowedRoles={['Admin']}><AdminRoutes /></ProtectedRoute>} />
        <Route path="/admin/stops" element={<ProtectedRoute allowedRoles={['Admin']}><AdminStops /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/trips" element={<ProtectedRoute allowedRoles={['Admin']}><AdminTrips /></ProtectedRoute>} />
        <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['Admin']}><AdminAlerts /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['Admin']}><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['Admin']}><AdminSettings /></ProtectedRoute>} />

        {/* --- Driver Protected Routes --- */}
        <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={['Driver']}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/live-trip" element={<ProtectedRoute allowedRoles={['Driver']}><DriverLiveTrip /></ProtectedRoute>} />
        <Route path="/driver/history" element={<ProtectedRoute allowedRoles={['Driver']}><DriverHistory /></ProtectedRoute>} />
        <Route path="/driver/profile" element={<ProtectedRoute allowedRoles={['Driver']}><DriverProfile /></ProtectedRoute>} />

        {/* --- Passenger Protected Routes --- */}
        <Route path="/passenger/dashboard" element={<ProtectedRoute allowedRoles={['Passenger']}><PassengerDashboard /></ProtectedRoute>} />
        <Route path="/passenger/find-bus" element={<ProtectedRoute allowedRoles={['Passenger']}><BusFinder /></ProtectedRoute>} />
        <Route path="/passenger/bus-details" element={<ProtectedRoute allowedRoles={['Passenger']}><BusDetails /></ProtectedRoute>} />
        <Route path="/passenger/alerts" element={<ProtectedRoute allowedRoles={['Passenger']}><Alerts /></ProtectedRoute>} />
        <Route path="/passenger/notifications" element={<ProtectedRoute allowedRoles={['Passenger']}><Notifications /></ProtectedRoute>} />
        <Route path="/passenger/history" element={<ProtectedRoute allowedRoles={['Passenger']}><TripHistory /></ProtectedRoute>} />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;