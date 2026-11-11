const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'frontend/src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf-8');

const adminImports = `
import AdminBuses from './pages/Admin/Buses.jsx';
import AdminDrivers from './pages/Admin/Drivers.jsx';
import AdminRoutes from './pages/Admin/Routes.jsx';
import AdminStops from './pages/Admin/Stops.jsx';
import AdminUsers from './pages/Admin/Users.jsx';
import AdminTrips from './pages/Admin/Trips.jsx';
import AdminAlerts from './pages/Admin/Alerts.jsx';
import AdminNotifications from './pages/Admin/Notifications.jsx';
import AdminSettings from './pages/Admin/Settings.jsx';
`;

const driverImports = `
import DriverLiveTrip from './pages/Driver/LiveTrip.jsx';
import DriverHistory from './pages/Driver/History.jsx';
import DriverProfile from './pages/Driver/Profile.jsx';
`;

if (!appContent.includes('AdminBuses')) {
  appContent = appContent.replace('import AdminDashboard from', adminImports + driverImports + '\\nimport AdminDashboard from');
}

const adminRoutes = `
        <Route path="/admin/buses" element={<ProtectedRoute allowedRoles={['Admin']}><AdminBuses /></ProtectedRoute>} />
        <Route path="/admin/drivers" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDrivers /></ProtectedRoute>} />
        <Route path="/admin/routes" element={<ProtectedRoute allowedRoles={['Admin']}><AdminRoutes /></ProtectedRoute>} />
        <Route path="/admin/stops" element={<ProtectedRoute allowedRoles={['Admin']}><AdminStops /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/trips" element={<ProtectedRoute allowedRoles={['Admin']}><AdminTrips /></ProtectedRoute>} />
        <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['Admin']}><AdminAlerts /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['Admin']}><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['Admin']}><AdminSettings /></ProtectedRoute>} />
`;

const driverRoutes = `
        <Route path="/driver/live-trip" element={<ProtectedRoute allowedRoles={['Driver']}><DriverLiveTrip /></ProtectedRoute>} />
        <Route path="/driver/history" element={<ProtectedRoute allowedRoles={['Driver']}><DriverHistory /></ProtectedRoute>} />
        <Route path="/driver/profile" element={<ProtectedRoute allowedRoles={['Driver']}><DriverProfile /></ProtectedRoute>} />
`;

if (!appContent.includes('/admin/buses')) {
  appContent = appContent.replace('<Route path="/admin/dashboard"', adminRoutes + driverRoutes + '\\n        <Route path="/admin/dashboard"');
  fs.writeFileSync(appPath, appContent);
}

// Update Sidebar
const sidebarPath = path.join(__dirname, 'frontend/src/components/Sidebar.jsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

const newAdminLinks = `    const adminLinks = [
        { path: "/admin/dashboard", label: "Dashboard", icon: "⚙️" },
        { path: "/admin/buses", label: "Buses", icon: "🚌" },
        { path: "/admin/drivers", label: "Drivers", icon: "👨‍✈️" },
        { path: "/admin/routes", label: "Routes", icon: "🗺️" },
        { path: "/admin/stops", label: "Stops", icon: "🚏" },
        { path: "/admin/users", label: "Users", icon: "👥" },
        { path: "/admin/trips", label: "Trips", icon: "🔄" },
        { path: "/admin/alerts", label: "Alerts", icon: "⚠️" },
        { path: "/admin/notifications", label: "Notifications", icon: "🔔" },
        { path: "/admin/settings", label: "Settings", icon: "🔧" }
    ];`;

const newDriverLinks = `    const driverLinks = [
        { path: "/driver/dashboard", label: "Dashboard", icon: "🚌" },
        { path: "/driver/live-trip", label: "Live Trip", icon: "📡" },
        { path: "/driver/history", label: "History", icon: "🕒" },
        { path: "/driver/profile", label: "Profile", icon: "👤" }
    ];`;

if (sidebarContent.includes('const adminLinks = [')) {
  sidebarContent = sidebarContent.replace(/const adminLinks = \[[\s\S]*?\];/, newAdminLinks);
  sidebarContent = sidebarContent.replace(/const driverLinks = \[[\s\S]*?\];/, newDriverLinks);
  fs.writeFileSync(sidebarPath, sidebarContent);
}

console.log('Updated App and Sidebar');
