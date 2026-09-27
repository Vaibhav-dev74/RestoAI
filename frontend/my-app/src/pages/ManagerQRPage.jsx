import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';

export default function ManagerQRPage() {
  const [qr, setQr] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchQRData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Get QR data and user info
        const [qrRes, userRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/auth/generate-qr`, { headers }),
          axios.get(`${API_BASE_URL}/api/auth/me`, { headers }),
        ]);

        setQr(qrRes.data.qrData);
        setRestaurantName(userRes.data.user?.restaurant?.name || 'Restaurant');
      } catch (err) {
        console.error('Failed to load QR data:', err);
        setError('Could not load QR code data');
      } finally {
        setLoading(false);
      }
    }

    fetchQRData();
  }, [navigate]);

  const handleBackToDashboard = () => {
    navigate('/dashboard/manager/new');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qr).then(() => {
      alert('QR link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link. Please copy manually.');
    });
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`;
    link.download = `${restaurantName}-QR-Code.png`;
    link.click();
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading QR Code...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={handleBackToDashboard}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>QR Code Management - {restaurantName}</h2>
        <button 
          onClick={handleBackToDashboard}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>

      <div style={{ 
        padding: '30px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '15px',
        border: '1px solid #dee2e6',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#495057' }}>Current QR Code</h3>
        
        {qr && (
          <>
            <div style={{ marginBottom: '30px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=250x250`}
                alt="QR Code"
                style={{ 
                  border: '2px solid #dee2e6', 
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  padding: '10px'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ marginBottom: '15px', color: '#495057' }}>QR Link</h4>
              <div style={{ 
                padding: '15px', 
                backgroundColor: 'white', 
                border: '1px solid #dee2e6',
                borderRadius: '5px',
                wordBreak: 'break-all',
                fontSize: '14px',
                color: '#495057'
              }}>
                {qr}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleCopyLink}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Copy Link
              </button>
              
              <button 
                onClick={handleDownloadQR}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Download QR
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '10px'
      }}>
        <h4 style={{ marginBottom: '15px', color: '#495057' }}>Instructions</h4>
        <ul style={{ textAlign: 'left', color: '#6c757d' }}>
          <li>Share this QR code or link with waiters who need to join your restaurant</li>
          <li>Waiters can scan the QR code or use the link to join automatically</li>
          <li>The QR code contains a secure token that expires in 24 hours</li>
          <li>You can generate a new QR code anytime from the dashboard</li>
        </ul>
      </div>
    </div>
  );
} 