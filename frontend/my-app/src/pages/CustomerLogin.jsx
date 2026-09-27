// pages/CustomerLogin.jsx (updated)
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './login.css';
import { API_BASE_URL } from '../config/apiBaseUrl';

export default function CustomerLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, form);
      const { token, user } = response.data;
      
      // Store both token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/restaurants');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg-2028">
      <div className="login-card-2028">
        <div className="login-logo-2028">
          <span>RestoFinder</span>
        </div>
        <h2 className="login-title-2028">Welcome Back</h2>
        <p style={{ textAlign: 'center', marginTop: '-1rem', marginBottom: '1.5rem', color: '#64748b' }}>
          Sign in to continue ordering
        </p>
        <form className="login-form-2028" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="login-input-2028 login-float-input"
              placeholder="Email"
            />
          </div>
          <div className="login-input-group">
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="login-input-2028 login-float-input"
              placeholder="Password"
            />
          </div>
          <button type="submit" className="login-btn-2028" disabled={loading}>
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>
        {error && (
          <div className="login-alert-2028 show">
            {error}
          </div>
        )}
        <div className="login-bottom-2028">
          <span>Don't have an account?</span>
          <Link to="/customer-register" className="login-link-2028">Sign up</Link>
        </div>
      </div>
    </div>
  );
}