import { useState } from 'react';
import axios from 'axios';

export default function SmartLeftoverReuse({ restaurantId, userRole }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const fetchLeftoverSuggestions = async () => {
    if (!input.trim()) {
      setError('Please describe your leftover ingredients');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in. Please login again.');
      setHasSearched(true);
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/ai/smartwaste`,
        { input: input.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const payload = response?.data;
      console.debug('[SmartLeftoverReuse] /api/ai/smartwaste response:', payload);

      const coerceToArray = (value) => {
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.suggestions)) return value.suggestions;
        if (Array.isArray(value?.data)) return value.data;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const list = coerceToArray(payload);
      setSuggestions(list);
      setLoading(false);
    } catch (err) {
      console.error('Leftover reuse error:', err);
      const status = err?.response?.status;
      if (status === 401) {
        setError('Unauthorized. Please login again.');
      } else {
        setError(err?.response?.data?.error || 'Unable to generate suggestions');
      }
      setLoading(false);
    }
  };

  const getDemandColor = (demand) => {
    if (demand >= 8) return '#4caf50';
    if (demand >= 6) return '#ff9800';
    return '#f44336';
  };

  const getDemandLabel = (demand) => {
    if (demand >= 8) return 'HIGH';
    if (demand >= 6) return 'MEDIUM';
    return 'LOW';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchLeftoverSuggestions();
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          color: '#ff6f00', 
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Smart Leftover Helper
        </h3>
        <p style={{ 
          margin: 0, 
          color: '#666', 
          fontSize: '13px' 
        }}>
          Turn leftover ingredients into profitable recipes
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            color: '#333', 
            fontSize: '13px',
            fontWeight: 'bold'
          }}>
            What leftover ingredients do you have?
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., leftover rice, chicken, vegetables, bread, etc."
            style={{ 
              width: '100%',
              minHeight: '60px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '13px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            disabled={loading}
          />
        </div>
        <button 
          type="submit"
          disabled={loading || !input.trim()}
          style={{ 
            width: '100%',
            padding: '10px', 
            backgroundColor: loading || !input.trim() ? '#e2e8f0' : '#ff6f00', 
            color: loading || !input.trim() ? '#64748b' : 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '🔄 Generating Ideas...' : '🧠 Get Smart Suggestions'}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fef3c7', 
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>⚠️</div>
          <p style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '13px' }}>{error}</p>
          <button 
            onClick={fetchLeftoverSuggestions}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#6366f1', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e9ecef', 
            borderTop: '3px solid #ff6f00', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <div style={{ 
            fontSize: '14px', 
            color: '#ff6f00', 
            fontWeight: 'bold',
            marginBottom: '6px'
          }}>
            Cooking up ideas...
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#666' 
          }}>
            Analyzing your ingredients for the best recipes
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
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
          {suggestions.slice(0, 2).map((suggestion, index) => (
            <div 
              key={index}
              style={{ 
                padding: '16px', 
                backgroundColor: '#fff3e0', 
                borderRadius: '10px',
                border: '1px solid #ffb300',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{ 
                  fontSize: '24px',
                  color: '#ff6f00',
                  marginTop: '2px'
                }}>
                  🍳
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <h4 style={{ 
                      margin: 0, 
                      color: '#e65100', 
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {suggestion.recipe}
                    </h4>
                    <div style={{ 
                      padding: '3px 6px',
                      backgroundColor: getDemandColor(suggestion.demand),
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '9px',
                      fontWeight: 'bold'
                    }}>
                      {getDemandLabel(suggestion.demand)}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '10px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#e8f5e8', 
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '1px solid #c8e6c9'
                    }}>
                      <div style={{ fontSize: '14px', marginBottom: '2px' }}>💰</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        color: '#2e7d32'
                      }}>
                        {suggestion.profit}
                      </div>
                      <div style={{ fontSize: '9px', color: '#666' }}>Profit</div>
                    </div>
                    
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#e3f2fd', 
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '1px solid #bbdefb'
                    }}>
                      <div style={{ fontSize: '14px', marginBottom: '2px' }}>📈</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        color: '#1976d2'
                      }}>
                        {suggestion.demand}/10
                      </div>
                      <div style={{ fontSize: '9px', color: '#666' }}>Demand</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Suggestions State */}
      {!loading && hasSearched && suggestions.length === 0 && (
        <div style={{ 
          padding: '20px 16px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤔</div>
          <div style={{ 
            fontSize: '14px', 
            color: '#6c757d', 
            fontWeight: 'bold',
            marginBottom: '6px'
          }}>
            No recipes found
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#6c757d' 
          }}>
            Try describing your ingredients differently
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
              <h3 style={{ margin: 0, color: '#ff6f00', fontSize: 18, fontWeight: 'bold' }}>
                💡 How Smart Leftover Helper Works
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
                  color: '#ff6f00', 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  marginTop: 2
                }}>
                  🍽️
                </span>
                <p style={{ 
                  margin: 0, 
                  color: '#232946', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  Describe your leftover ingredients in the input field above
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: 12,
                gap: 8
              }}>
                <span style={{ 
                  color: '#ff6f00', 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  marginTop: 2
                }}>
                  🧠
                </span>
                <p style={{ 
                  margin: 0, 
                  color: '#232946', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  Our AI analyzes your ingredients and suggests creative recipes
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: 12,
                gap: 8
              }}>
                <span style={{ 
                  color: '#ff6f00', 
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
                  Each suggestion includes estimated profit potential and demand score
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 8
              }}>
                <span style={{ 
                  color: '#ff6f00', 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  marginTop: 2
                }}>
                  📈
                </span>
                <p style={{ 
                  margin: 0, 
                  color: '#232946', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  Turn waste into profit by creating new menu items from leftovers
                </p>
              </div>
            </div>
            
            <div style={{ 
              background: '#fff3e0', 
              borderRadius: 8, 
              padding: 12,
              border: '1px solid #ffb300'
            }}>
              <div style={{ fontSize: 12, color: '#e65100', fontWeight: 600, marginBottom: 4 }}>
                💡 Pro Tip:
              </div>
              <div style={{ fontSize: 11, color: '#ff6f00', lineHeight: 1.4 }}>
                Be specific about quantities and types of ingredients for better recipe suggestions. Include any dietary restrictions or preferences.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 