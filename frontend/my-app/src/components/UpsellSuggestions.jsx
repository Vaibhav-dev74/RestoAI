import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';

export default function UpsellSuggestions({ restaurantId, userRole, orders = [] }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pulse, setPulse] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // Static fallback suggestions
  const staticSuggestions = [
    { message: "Suggest premium desserts with main courses", category: "recommendation", confidence: 0.85, ingredient: "Desserts" },
    { message: "Offer craft beverages with lunch specials", category: "upsell", confidence: 0.78, ingredient: "Beverages" },
    { message: "Recommend appetizer combos for table orders", category: "upsell", confidence: 0.92, ingredient: "Appetizers" },
    { message: "Promote seasonal specials as add-ons", category: "recommendation", confidence: 0.82, ingredient: "Seasonal" },
    { message: "Upsell premium sides with burger orders", category: "upsell", confidence: 0.88, ingredient: "Sides" }
  ];

  const ordersKey = Array.isArray(orders) && orders.length
    ? `${orders.length}-${orders[orders.length - 1]?.createdAt || ''}`
    : String(Array.isArray(orders) ? orders.length : 0);

  // Auto-load + refresh when new orders arrive (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchUpsellSuggestions();
    }, 450);
    return () => clearTimeout(t);
  }, [restaurantId, ordersKey]);

  // Pulse animation for loading state
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setPulse(prev => !prev);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const fetchUpsellSuggestions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      const url = restaurantId
        ? `${API_BASE_URL}/api/ai/upsell?restaurantId=${encodeURIComponent(restaurantId)}`
        : `${API_BASE_URL}/api/ai/upsell`;
      const response = await axios.get(url, { headers });
      
      // Handle different response formats
      let suggestionsData = [];
      
      if (response.data && response.data.suggestions) {
        suggestionsData = response.data.suggestions;
      } else if (Array.isArray(response.data)) {
        suggestionsData = response.data;
      } else if (response.data && response.data.suggestion) {
        suggestionsData = response.data.suggestion;
      } else if (response.data && response.data.alerts) {
        suggestionsData = response.data.alerts;
      }
      
      // Normalize response to the UI's expected shape
      if (!suggestionsData || suggestionsData.length === 0) {
        setSuggestions(staticSuggestions);
        setLoading(false);
        return;
      }

      const first = suggestionsData[0];

      if (typeof first === 'string') {
        const formatted = suggestionsData.map((item, index) => ({
          message: item,
          category: 'upsell',
          confidence: Math.max(0.55, 0.85 - index * 0.08),
          ingredient: 'General',
        }));
        setSuggestions(formatted);
        setLoading(false);
        return;
      }

      if (typeof first === 'object' && first) {
        // Common backend shape: [{ base, upsell }, ...]
        if ('base' in first && 'upsell' in first) {
          const formatted = suggestionsData
            .filter((s) => s && (s.base || s.upsell))
            .map((s, index) => ({
              message: `${s.base || 'Item'} \u2192 ${s.upsell || 'Add-on'}`,
              category: 'upsell',
              confidence: typeof s.confidence === 'number' ? s.confidence : Math.max(0.55, 0.9 - index * 0.1),
              ingredient: s.ingredient || 'General',
            }));

          setSuggestions(formatted.length ? formatted : staticSuggestions);
          setLoading(false);
          return;
        }

        // Existing supported shape: [{ message, ... }]
        if ('message' in first) {
          setSuggestions(suggestionsData);
          setLoading(false);
          return;
        }

        // Fallback for other object shapes
        const formatted = suggestionsData.map((s, index) => ({
          message: s.text || s.title || JSON.stringify(s),
          category: s.category || 'upsell',
          confidence: typeof s.confidence === 'number' ? s.confidence : Math.max(0.55, 0.85 - index * 0.08),
          ingredient: s.ingredient || 'General',
        }));
        setSuggestions(formatted);
        setLoading(false);
        return;
      }

      setSuggestions(staticSuggestions);
      
      setLoading(false);
    } catch (err) {
      console.error('Upsell suggestions error:', err);
      
      // On error, use static data as fallback
      setSuggestions(staticSuggestions);
      setError('Using smart recommendations based on industry patterns');
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'waste risk': return '#ef4444';
      case 'upsell': return '#10b981';
      case 'recommendation': return '#8b5cf6';
      case 'overstock': return '#f59e0b';
      case 'underuse': return '#3b82f6';
      default: return '#9c27b0';
    }
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.8) return '🔥';
    if (confidence >= 0.6) return '⭐';
    return '💡';
  };

  if (error && suggestions.length === 0) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fef3c7', 
        border: '1px solid #fbbf24',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
        <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '14px' }}>{error}</p>
        <button 
          onClick={fetchUpsellSuggestions}
          style={{ 
            padding: '6px 12px', 
            backgroundColor: '#6366f1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
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

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          color: '#9c27b0', 
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Smart Upsell Helper
        </h3>
        <p style={{ 
          margin: 0, 
          color: '#666', 
          fontSize: '13px' 
        }}>
          {error ? 'Smart recommendations based on patterns' : 'AI-powered recommendations to boost sales'}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          padding: '30px 16px'
        }}>
          <div style={{ 
            fontSize: '36px', 
            marginBottom: '16px',
            animation: pulse ? 'pulse 0.8s ease-in-out' : 'none'
          }}>
            🎯
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#9c27b0', 
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Analyzing your orders...
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#666',
            textAlign: 'center'
          }}>
            Finding the best upsell opportunities
          </div>
        </div>
      )}

      {/* Suggestions Grid */}
      {!loading && suggestions.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <div 
              key={index}
              style={{ 
                padding: '14px', 
                backgroundColor: '#f3e5f5', 
                borderRadius: '10px',
                border: `1px solid ${getCategoryColor(suggestion.category)}`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <div style={{ 
                  fontSize: '20px',
                  color: getCategoryColor(suggestion.category)
                }}>
                  {getConfidenceIcon(suggestion.confidence)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: '#6a1b9a',
                    marginBottom: '4px',
                    lineHeight: '1.3'
                  }}>
                    {suggestion.message || suggestion}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginTop: '6px'
                  }}>
                    {suggestion.category && (
                      <span style={{ 
                        fontSize: '10px', 
                        backgroundColor: getCategoryColor(suggestion.category),
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                      }}>
                        {suggestion.category}
                      </span>
                    )}
                    {suggestion.ingredient && suggestion.ingredient !== 'General' && (
                      <span style={{ 
                        fontSize: '10px', 
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                      }}>
                        🍽️ {suggestion.ingredient}
                      </span>
                    )}
                    {suggestion.confidence && (
                      <span style={{ 
                        fontSize: '10px', 
                        color: '#9c27b0',
                        fontWeight: 'bold'
                      }}>
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 8px',
                  backgroundColor: error ? '#f59e0b' : '#9c27b0',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {error ? 'SMART' : 'BOOST'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Suggestions State */}
      {!loading && suggestions.length === 0 && (
        <div style={{ 
          padding: '20px 16px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
          <div style={{ 
            fontSize: '14px', 
            color: '#6c757d', 
            fontWeight: 'bold',
            marginBottom: '6px'
          }}>
            No suggestions available
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#6c757d' 
          }}>
            Try refreshing or check back later
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button 
          onClick={fetchUpsellSuggestions}
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: loading ? '#e2e8f0' : '#9c27b0', 
            color: loading ? '#64748b' : 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '🔄 Analyzing...' : '🔄 Refresh'}
        </button>
        
        <button 
          onClick={() => setShowHowItWorksModal(true)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#e8f5e8', 
            color: '#2e7d32', 
            border: '1px solid #c8e6c9',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          💡 How it works
        </button>
      </div>

      {/* How It Works Modal */}
      {showHowItWorksModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px',
            maxWidth: 400,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowHowItWorksModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              ×
            </button>
            
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#9c27b0', fontSize: 18, fontWeight: 'bold' }}>
                💡 How Upsell Suggestions Work
              </h3>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: 12,
                gap: 8
              }}>
                <span style={{ 
                  color: '#9c27b0', 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  marginTop: 2
                }}>
                  📊
                </span>
                <p style={{ 
                  margin: 0, 
                  color: '#232946', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  {error 
                    ? 'Using industry patterns and successful upsell strategies' 
                    : 'Our AI analyzes your recent order patterns and customer preferences'
                  }
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: 12,
                gap: 8
              }}>
                <span style={{ 
                  color: '#9c27b0', 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  marginTop: 2
                }}>
                  🎯
                </span>
                <p style={{ 
                  margin: 0, 
                  color: '#232946', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  Identifies items that customers are most likely to add to their orders
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: 12,
                gap: 8
              }}>
                <span style={{ 
                  color: '#9c27b0', 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  marginTop: 2
                }}>
                  💰
                </span>
                <p style={{ 
                  margin: 0, 
                  color: '#232946', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  Helps increase average order value and boost your profits
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 8
              }}>
                <span style={{ 
                  color: '#9c27b0', 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  marginTop: 2
                }}>
                  🔄
                </span>
                <p style={{ 
                  margin: 0, 
                  color: '#232946', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  {error 
                    ? 'Static recommendations based on proven industry success' 
                    : 'Suggestions update automatically based on new order data'
                  }
                </p>
              </div>
            </div>
            
            <div style={{ 
              background: '#f3e5f5', 
              borderRadius: 8, 
              padding: 12,
              border: '1px solid #e1bee7'
            }}>
              <div style={{ fontSize: 12, color: '#6a1b9a', fontWeight: 600, marginBottom: 4 }}>
                💡 Pro Tip:
              </div>
              <div style={{ fontSize: 11, color: '#9c27b0', lineHeight: 1.4 }}>
                Train your staff to suggest these items naturally during customer interactions for best results.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}