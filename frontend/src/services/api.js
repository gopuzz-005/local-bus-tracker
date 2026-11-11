import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT if we store it in localStorage 
// (or leave it if relying solely on httpOnly cookies)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (e.g. redirect to login or clear token)
      console.error("Unauthorized! Logging out...");
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Optional: auto redirect
    }
    return Promise.reject(error);
  }
);

export default api;
