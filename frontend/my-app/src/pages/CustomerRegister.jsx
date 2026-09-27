// pages/CustomerRegister.jsx (updated)
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './login.css';
import { API_BASE_URL } from '../config/apiBaseUrl';

export default function CustomerRegister() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    phone: '',
    address: {
      label: 'Home',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [step, setStep] = useState(1); // 1: basic info, 2: address
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setForm({
        ...form,
        address: {
          ...form.address,
          [addressField]: value
        }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmitBasic = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmitComplete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // First register the user
      const payload = { 
        ...form, 
        role: 'customer',
        addresses: [form.address] // Send address as array
      };
      
      const registerResponse = await axios.post(`${VITE_API_URL}/api/auth/register`, payload);
      
      if (registerResponse.data.token) {
        // Login the user
        const loginResponse = await axios.post(`${VITE_API_URL}/api/auth/login`, { 
          email: form.email, 
          password: form.password 
        });
        
        // Store user data in localStorage
        localStorage.setItem('token', loginResponse.data.token);
        localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
        
        // Redirect to restaurants page
        navigate('/restaurants');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. The email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg-2028">
      <div className="login-card-2028" style={{ maxWidth: '500px' }}>
        <div className="login-logo-2028">
          <span>RestoFinder</span>
        </div>
        
        {/* Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: step === 1 ? '#f97316' : '#22c55e',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>1</div>
          <div style={{
            width: '60px',
            height: '2px',
            background: step === 2 ? '#22c55e' : '#e5e7eb',
            marginTop: '19px'
          }}></div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: step === 2 ? '#f97316' : '#e5e7eb',
            color: step === 2 ? 'white' : '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>2</div>
        </div>

        <h2 className="login-title-2028">
          {step === 1 ? 'Create Account' : 'Delivery Address'}
        </h2>
        
        {step === 1 ? (
          <form className="login-form-2028" onSubmit={handleSubmitBasic}>
            <div className="login-input-group">
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className="login-input-2028 login-float-input"
                placeholder="Full Name"
              />
            </div>
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
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                className="login-input-2028 login-float-input"
                placeholder="Phone Number"
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
            <button type="submit" className="login-btn-2028">
              <span>Continue</span>
            </button>
          </form>
        ) : (
          <form className="login-form-2028" onSubmit={handleSubmitComplete}>
            <div className="login-input-group">
              <input
                name="address.label"
                type="text"
                value={form.address.label}
                onChange={handleChange}
                required
                className="login-input-2028 login-float-input"
                placeholder="Address Label (e.g., Home, Work)"
              />
            </div>
            <div className="login-input-group">
              <input
                name="address.address"
                type="text"
                value={form.address.address}
                onChange={handleChange}
                required
                className="login-input-2028 login-float-input"
                placeholder="Street Address"
              />
            </div>
            <div className="login-input-group">
              <input
                name="address.city"
                type="text"
                value={form.address.city}
                onChange={handleChange}
                required
                className="login-input-2028 login-float-input"
                placeholder="City"
              />
            </div>
            <div className="login-input-group">
              <input
                name="address.state"
                type="text"
                value={form.address.state}
                onChange={handleChange}
                required
                className="login-input-2028 login-float-input"
                placeholder="State"
              />
            </div>
            <div className="login-input-group">
              <input
                name="address.zipCode"
                type="text"
                value={form.address.zipCode}
                onChange={handleChange}
                required
                className="login-input-2028 login-float-input"
                placeholder="Zip Code"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="login-btn-2028"
                style={{ background: '#6b7280' }}
              >
                <span>Back</span>
              </button>
              <button 
                type="submit" 
               
                className="login-btn-2028"
                style={{ background: '#6b7280' }}
              >
                <span>Back</span>
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="login-alert-2028 show">
            {error}
          </div>
        )}
        
        <div className="login-bottom-2028">
          <span>Already have an account?</span>
          <Link to="/customer-login" className="login-link-2028">Sign in</Link>
        </div>
      </div>
    </div>
  );
}