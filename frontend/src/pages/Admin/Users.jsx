import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const Users = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/admin/users');
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching admin users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span>👥</span> {t("Users")} Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          System user accounts, roles, access permissions, and profiles.
        </p>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {loading ? (
          <p className="text-slate-400 p-8 text-center">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-slate-400 p-8 text-center italic">No registered users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/70 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          u.role === 'Admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : u.role === 'Driver'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{u.phone || 'Standard'}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
