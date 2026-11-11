import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import LanguageSelector from '../../components/LanguageSelector';
import '../../styles/AdminLogin.css';

const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop";

// --- Minimal Clean SVG Icons ---
const Icons = {
  Shield: () => (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  EyeOff: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
};

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(user.role === 'Admin' ? '/admin/dashboard' : '/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(formData.email, formData.password, true);
      if (res?.success) {
        navigate('/admin/dashboard');
      } else {
        setError(res?.message || 'Invalid credentials. Please verify and try again.');
      }
    } catch (err) {
      setError('A system error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="auth-container relative" 
      style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
    >
      <div className="auth-overlay"></div>
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector variant="auth" />
      </div>

      <div className="auth-card admin-card">
        {/* Header */}
        <div className="auth-header">
          <div className="admin-badge-icon">
            <Icons.Shield />
          </div>
          <h2>Admin Portal</h2>
          <p>Sign in with your administrative credentials to continue.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-alert error" role="alert" aria-live="assertive">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icons.Mail />
              </span>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="admin-password">Password</label>
            </div>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icons.Lock />
              </span>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-content">
                <Icons.Spinner /> Authenticating...
              </span>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Footers */}
        <div className="auth-footer">
          <p className="auth-link">
            Need an admin account?{' '}
            <Link to="/admin-register" className="highlight-link">
              Request Access
            </Link>
          </p>
          <div className="divider">
            <span>or</span>
          </div>
          <p className="auth-link secondary">
            <Link to="/login" className="back-link">
              ← Return to Passenger / Driver Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;