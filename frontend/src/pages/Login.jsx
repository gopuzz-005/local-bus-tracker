import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import '../index.css';
import '../styles/Login.css';

// Using a stable bus image from Unsplash for the background
const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop";

const Login = ({ isAdmin = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password, isAdmin);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-container relative" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <div className="auth-overlay"></div>
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector variant="auth" />
      </div>
      <div className="auth-card">
        <h2>{isAdmin ? 'Admin Portal' : 'Welcome Back'}</h2>
        <p>{isAdmin ? 'Login with your administrator credentials.' : 'Login to your account to track buses.'}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className={`btn ${isAdmin ? 'btn-danger bg-rose-600' : 'btn-primary'}`}>
            {isAdmin ? 'Admin Login' : 'Login'}
          </button>
        </form>
        {!isAdmin && (
          <p className="auth-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        )}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p className="auth-link" style={{ fontSize: '0.9rem', color: '#666' }}>
            {isAdmin ? (
              <Link to="/login" style={{ color: '#0056b3' }}>Back to User Login</Link>
            ) : (
              <>Authorized Personnel: <Link to="/admin-login" style={{ color: '#0056b3' }}>Admin Login</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
