import { useState, useEffect } from 'react';
import axios from 'axios';

export default function InventoryWasteAlert({ restaurantId, userRole }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-load inventory alerts on component mount
  useEffect(() => {
    if (restaurantId) {
      fetchInventoryAlerts();
    }
  }, [restaurantId]);

  const fetchInventoryAlerts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/orders/inventoryalert`, // Use environment variable
        { headers }
      );

      setAlerts(response.data.alerts || []);
      setLoading(false);
    } catch (err) {
      console.error('Inventory alert error:', err);
      setError('Unable to load inventory alerts');
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'waste risk':
        return '#dc3545';
      case 'overstock':
        return '#fd7e14';
      case 'underuse':
        return '#ffc107';
      case 'recommendation':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'waste risk':
        return '🚨';
      case 'overstock':
        return '📦';
      case 'underuse':
        return '⚠️';
      case 'recommendation':
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'waste risk':
        return 'WASTE RISK';
      case 'overstock':
        return 'OVERSTOCK';
      case 'underuse':
        return 'UNDERUSE';
      case 'recommendation':
        return 'RECOMMENDATION';
      default:
        return 'ALERT';
    }
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return 'Critical';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return '#dc3545';
    if (confidence >= 0.8) return '#fd7e14';
    if (confidence >= 0.7) return '#ffc107';
    return '#6c757d';
  };

  const handleAction = (action, alert) => {
    console.log(`${action} for ${alert.ingredient}`);
    // Here you would implement the actual action logic
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: 'rgba(255,255,255,0.8)', 
        borderRadius: 12,
        textAlign: 'center',
        border: '1px solid rgba(224,231,255,0.6)'
      }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          border: '3px solid #e0e7ff', 
          borderTop: '3px solid #6366f1', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px auto'
        }}></div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
          Analyzing inventory patterns...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fef3c7', 
        border: '1px solid #fbbf24',
        borderRadius: 12,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚠️</div>
        <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '13px', fontWeight: 600 }}>{error}</p>
        <button 
          onClick={fetchInventoryAlerts}
          style={{ 
            padding: '6px 12px', 
            backgroundColor: '#6366f1', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const totalAlerts = alerts.length;

  return (
    <div style={{ padding: '0' }}>
      {/* Summary Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #2196f3 100%)',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #2196f3'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: '20px' }}>📊</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1976d2' }}>
              Inventory Waste Alert
            </div>
            <div style={{ fontSize: '11px', color: '#1976d2', opacity: 0.8 }}>
              {totalAlerts} alerts detected
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            style={{ 
              padding: '4px 8px',
              background: currentSlide === 0 ? '#e2e8f0' : '#6366f1',
              color: currentSlide === 0 ? '#64748b' : 'white',
              border: 'none',
              borderRadius: 6,
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ←
          </button>
          <button 
            onClick={() => setCurrentSlide(Math.min(totalAlerts - 1, currentSlide + 1))}
            disabled={currentSlide === totalAlerts - 1}
            style={{ 
              padding: '4px 8px',
              background: currentSlide === totalAlerts - 1 ? '#e2e8f0' : '#6366f1',
              color: currentSlide === totalAlerts - 1 ? '#64748b' : 'white',
              border: 'none',
              borderRadius: 6,
              cursor: currentSlide === totalAlerts - 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Alert Display */}
      {totalAlerts > 0 ? (
        <div style={{ 
          background: 'rgba(255,255,255,0.9)', 
          borderRadius: 12, 
          padding: 16,
          border: '1px solid rgba(224,231,255,0.6)',
          marginBottom: '12px'
        }}>
          {alerts[currentSlide] && (
            <div>
              {/* Alert Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12 
              }}>
                <div style={{ 
                  fontSize: '16px',
                  color: getCategoryColor(alerts[currentSlide].category)
                }}>
                  {getCategoryIcon(alerts[currentSlide].category)}
                </div>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: '#232946',
                    marginBottom: 2
                  }}>
                    {alerts[currentSlide].ingredient}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#64748b',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>
                    {getCategoryLabel(alerts[currentSlide].category)}
                  </div>
                </div>
                <div style={{ 
                  padding: '3px 6px',
                  backgroundColor: getConfidenceColor(alerts[currentSlide].confidence),
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  marginLeft: 'auto'
                }}>
                  {getConfidenceLevel(alerts[currentSlide].confidence)}
                </div>
              </div>

              {/* Alert Content */}
              <div style={{ 
                background: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                border: `1px solid ${getCategoryColor(alerts[currentSlide].category)}20`
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#495057',
                  lineHeight: 1.4
                }}>
                  {alerts[currentSlide].message}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleAction('adjust', alerts[currentSlide])}
                  style={{ 
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  📊 Adjust Stock
                </button>
                <button 
                  onClick={() => handleAction('order', alerts[currentSlide])}
                  style={{ 
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #28a745, #20c997)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                  }}
                >
                  📦 Order More
                </button>
                <button 
                  onClick={() => handleAction('ignore', alerts[currentSlide])}
                  style={{ 
                    padding: '6px 12px',
                    background: '#e2e8f0',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  ✋ Ignore
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          background: 'rgba(255,255,255,0.8)', 
          borderRadius: 12, 
          padding: 16,
          border: '1px solid rgba(224,231,255,0.6)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#22c55e', marginBottom: 4 }}>
            No Inventory Alerts
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Your inventory is well-managed and optimized
          </div>
        </div>
      )}

      {/* Slider Indicators */}
      {totalAlerts > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 6,
          marginTop: 12
        }}>
          {alerts.map((_, index) => (
            <div 
              key={index}
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%',
                background: index === currentSlide ? '#6366f1' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button 
          onClick={fetchInventoryAlerts}
          disabled={loading}
          style={{ 
            padding: '6px 12px', 
            backgroundColor: loading ? '#e2e8f0' : '#6366f1', 
            color: loading ? '#64748b' : 'white', 
            border: 'none', 
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '🔄 Analyzing...' : '🔄 Refresh Alerts'}
        </button>
      </div>
    </div>
  );
}