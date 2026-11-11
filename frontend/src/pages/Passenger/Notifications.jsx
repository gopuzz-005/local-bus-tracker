import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import AuthContext from '../../context/AuthContext';

const Notifications = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get(`/notifications/${user._id}`);
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications", error);
      }
      setLoading(false);
    };
    if (user?._id) fetchNotifications();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">{t("Notifications")}</h1>
      
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div key={notification._id} className={`p-4 rounded-xl border ${notification.isRead ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-500/10 border-blue-500/30'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-bold ${notification.isRead ? 'text-slate-300' : 'text-blue-400'}`}>
                    {notification.title}
                  </h3>
                  <p className="text-slate-400 mt-1 text-sm">{notification.message}</p>
                </div>
                {!notification.isRead && (
                  <button 
                    onClick={() => markAsRead(notification._id)}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Mark Read
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500 mt-3 block">{new Date(notification.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-400">
          No notifications.
        </div>
      )}
    </div>
  );
};

export default Notifications;
