import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import '../index.css';
import '../styles/Register.css';

const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop";

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Passenger');
  const [error, setError] = useState('');
  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(name, email, password, role);
    if (res.success) {
      navigate('/login');
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
        <h2>Create an Account</h2>
        <p>Sign up to track local buses or drive them.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="Enter your full name"
            />
          </div>
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
              placeholder="Create a password"
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Passenger">Passenger</option>
              <option value="Driver">Driver</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Register</button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
