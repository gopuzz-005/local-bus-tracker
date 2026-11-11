import React, { useContext, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const { t, language, changeLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const role = (user.role || '').toLowerCase();

    const passengerLinks = [
        { path: "/passenger/find-bus", label: "Find Bus", icon: "🔍" },
        { path: "/passenger/dashboard", label: "Tracker", icon: "📍" },
        { path: "/passenger/alerts", label: "Alerts", icon: "⚠️" },
        { path: "/passenger/notifications", label: "Notifications", icon: "🔔" },
        { path: "/passenger/history", label: "Trip History", icon: "🕒" }
    ];

        const driverLinks = [
        { path: "/driver/dashboard", label: "Dashboard", icon: "🚌" },
        { path: "/driver/live-trip", label: "Live Trip", icon: "📡" },
        { path: "/driver/history", label: "History", icon: "🕒" },
        { path: "/driver/profile", label: "Profile", icon: "👤" }
    ];

        const adminLinks = [
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
    ];

    let links = [];
    if (role === 'passenger') links = passengerLinks;
    if (role === 'driver') links = driverLinks;
    if (role === 'admin') links = adminLinks;

    return (
        <>
            {/* Mobile Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-[60] bg-slate-800 text-white p-2 rounded shadow-lg border border-slate-700"
            >
                {isOpen ? '✖' : '☰'}
            </button>

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700 
                transform transition-transform duration-300 ease-in-out flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-center">
                    <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
                        🚌 Bus Tracker
                    </h2>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <nav className="space-y-2">
                        {links.map((link, idx) => (
                            <NavLink 
                                key={idx}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) => 
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        isActive 
                                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }`
                                }
                            >
                                <span>{link.icon}</span>
                                <span className="font-medium">{t(link.label)}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-800">
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t("Language")}</label>
                        <LanguageSelector />
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-200">{user.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-lg shadow-blue-500/30 px-4 py-3 rounded-xl transition-all duration-300 font-bold tracking-wide transform hover:-translate-y-0.5"
                        title="Signout"
                    >
                        <span>🚪</span>
                        <span>Signout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                />
            )}
        </>
    );
};

export default Sidebar;
