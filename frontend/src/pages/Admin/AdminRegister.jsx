import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import LanguageSelector from '../../components/LanguageSelector';
import '../../styles/AdminRegister.css';

// High-resolution modern corporate / enterprise infrastructure background
const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop";

// --- Clean Inline SVG Icons (Zero Extra Dependencies) ---
const Icons = {
  UserShield: () => (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
  Key: () => (
    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecretKey: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(user.role === 'Admin' ? '/admin/dashboard' : '/');
    }
  }, [user, navigate]);

  // Compute password strength (0 to 4)
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation checks
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        'Admin',
        { adminSecretKey: formData.adminSecretKey.trim() }
      );
      if (res?.success) {
        setSuccessMsg('Admin account created successfully! Redirecting to Admin Login...');
        setTimeout(() => {
          navigate('/admin-login');
        }, 1500);
      } else {
        setError(res?.message || 'Registration failed. Please verify the information provided.');
      }
    } catch (err) {
      setError('A network or server error occurred. Please try again.');
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
            <Icons.UserShield />
          </div>
          <h2>Admin Registration</h2>
          <p>Create an administrator account with elevated privileges.</p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="auth-alert success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }} role="status">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

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
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="admin-name">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icons.User />
              </span>
              <input
                id="admin-name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Morgan"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="admin-email">Official Admin Email</label>
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
                placeholder="admin@company.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icons.Lock />
              </span>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
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

            {/* Password Strength Indicator Bar */}
            {formData.password && (
              <div className="strength-bar-container">
                <div 
                  className={`strength-bar score-${passwordStrength}`} 
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="admin-confirm-password">Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icons.Lock />
              </span>
              <input
                id="admin-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex="-1"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>

          {/* Admin Security Passcode / Setup Key */}
          <div className="form-group">
            <label htmlFor="admin-secret-key">Admin Security Passcode (Invite Key)</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icons.Key />
              </span>
              <input
                id="admin-secret-key"
                name="adminSecretKey"
                type="password"
                value={formData.adminSecretKey}
                onChange={handleChange}
                placeholder="Required for administrative account creation"
                disabled={loading}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              Default development setup key: <code style={{ color: '#38bdf8' }}>Admin@SecretKey2026</code>
            </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-content">
                <Icons.Spinner /> Setting Up Account...
              </span>
            ) : (
              'Create Admin Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-link">
            Already registered?{' '}
            <Link to="/admin-login" className="highlight-link">
              Admin Login
            </Link>
          </p>
          <div className="divider">
            <span>or</span>
          </div>
          <p className="auth-link secondary">
            <Link to="/register" className="back-link">
              ← Back to User Registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;