import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { t, language, changeLanguage } = useLanguage();

    return (
        <nav className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
                            🚌 Local Bus Tracker
                        </Link>
                    </div>
                    
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Language Selector */}
                        <select 
                            value={language} 
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="bg-slate-700 text-slate-300 border-none rounded px-2 py-1 text-sm outline-none"
                        >
                            <option value="English">English</option>
                            <option value="Tamil">தமிழ்</option>
                            <option value="Malayalam">മലയാളം</option>
                        </select>

                        {user ? (
                            <>
                                {/* Passenger Links */}
                                {user.role?.toLowerCase() === 'passenger' && (
                                    <>
                                        <Link to="/passenger/find-bus" className="text-slate-300 hover:text-white px-2 text-sm">{t("Find Bus")}</Link>
                                        <Link to="/passenger/dashboard" className="text-slate-300 hover:text-white px-2 text-sm">Tracker</Link>
                                        <Link to="/passenger/alerts" className="text-slate-300 hover:text-white px-2 text-sm">{t("Alerts")}</Link>
                                        <Link to="/passenger/notifications" className="text-slate-300 hover:text-white px-2 text-sm">{t("Notifications")}</Link>
                                        <Link to="/passenger/history" className="text-slate-300 hover:text-white px-2 text-sm">{t("Trip History")}</Link>
                                    </>
                                )}
                                {/* Shared Info */}
                                <span className="text-slate-400 text-sm italic ml-4">{user.name}</span>
                                <button onClick={logout} className="ml-4 text-rose-400 border border-rose-400/30 px-3 py-1 rounded hover:bg-rose-400/10">
                                    {t("Logout")}
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded">Login</Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;