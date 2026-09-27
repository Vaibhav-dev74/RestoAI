import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import WasteAnalysis from '../components/WasteAnalysis.jsx';
import SalesProfitAdvisor from '../components/SalesProfitAdvisor.jsx';
import UpsellSuggestions from '../components/UpsellSuggestions.jsx';
import SmartLeftoverReuse from '../components/SmartLeftoverReuse.jsx';
import InventoryWasteAlert from '../components/InventoryWasteAlert.jsx';

export default function VendorDashboard() {
  const [userData, setUserData] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const userRes = await axios.get('http://localhost:5000/api/auth/me', { headers });

        console.log('Vendor user response:', userRes.data);

        const user = userRes.data?.user;
        setUserData(user);
        
        // For vendors, we'll use a default restaurant ID or get it from user data
        setRestaurantId(user?.restaurant?.id || 1); // Default to restaurant ID 1 for demo

        if (!user || user.role !== 'vendor') {
          setError('Access denied. Vendor role required.');
        }
      } catch (err) {
        console.error('Fetch error:', err?.response?.data || err.message);
        setError('Error loading vendor data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleInventoryManagement = () => {
    navigate('/inventory');
  };

  const handleOrderTracking = () => {
    navigate('/vendor/orders');
  };

  const handleSupplierInfo = () => {
    navigate('/vendor/supplier');
  };

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const sidebarItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      color: '#007bff' 
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      ), 
      color: '#fd7e14' 
    },
    { 
      id: 'orders', 
      label: 'Order Tracking', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ), 
      color: '#28a745' 
    },
    { 
      id: 'supplier', 
      label: 'Supplier Info', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ), 
      color: '#6f42c1' 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ), 
      color: '#20c997' 
    }
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e9ecef', 
            borderTop: '4px solid #007bff', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
          <p style={{ color: '#6c757d', fontSize: '18px' }}>Loading Vendor Dashboard...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={handleLogout}>Go to Login</button>
      </div>
    );
  }

  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{ 
                padding: '25px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '15px',
                border: '1px solid #dee2e6',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: '#007bff', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  📦
                </div>
                <h3 style={{ marginBottom: '15px', color: '#495057' }}>Inventory Management</h3>
                <p style={{ marginBottom: '20px', color: '#6c757d' }}>
                  Manage your product inventory, track stock levels, and update product information.
                </p>
                <button 
                  onClick={handleInventoryManagement}
                  style={{ 
                    width: '100%',
                    padding: '12px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Manage Inventory
                </button>
              </div>

              <div style={{ 
                padding: '25px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '15px',
                border: '1px solid #dee2e6',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: '#28a745', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  📋
                </div>
                <h3 style={{ marginBottom: '15px', color: '#495057' }}>Order Tracking</h3>
                <p style={{ marginBottom: '20px', color: '#6c757d' }}>
                  Track incoming orders, manage delivery schedules, and update order status.
                </p>
                <button 
                  onClick={handleOrderTracking}
                  style={{ 
                    width: '100%',
                    padding: '12px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Track Orders
                </button>
              </div>

              <div style={{ 
                padding: '25px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '15px',
                border: '1px solid #dee2e6',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: '#fd7e14', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  🏢
                </div>
                <h3 style={{ marginBottom: '15px', color: '#495057' }}>Supplier Information</h3>
                <p style={{ marginBottom: '20px', color: '#6c757d' }}>
                  Manage your supplier profile, contact information, and business details.
                </p>
                <button 
                  onClick={handleSupplierInfo}
                  style={{ 
                    width: '100%',
                    padding: '12px', 
                    backgroundColor: '#fd7e14', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Manage Profile
                </button>
              </div>
            </div>

            <div style={{ 
              padding: '25px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '15px',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#495057' }}>Quick Statistics</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px'
              }}>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: 'white', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Active Products</h4>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#495057' }}>0</p>
                </div>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: 'white', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Pending Orders</h4>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#495057' }}>0</p>
                </div>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: 'white', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#fd7e14' }}>This Month</h4>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#495057' }}>0</p>
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '10px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#495057' }}>Vendor Dashboard Features</h4>
              <ul style={{ textAlign: 'left', color: '#6c757d', lineHeight: '1.6' }}>
                <li><strong>Inventory Management:</strong> Add, edit, and track your product inventory</li>
                <li><strong>Order Tracking:</strong> Monitor incoming orders and manage delivery schedules</li>
                <li><strong>Supplier Profile:</strong> Update your business information and contact details</li>
                <li><strong>Analytics:</strong> View sales statistics and performance metrics</li>
                <li><strong>Communication:</strong> Connect with restaurant managers and staff</li>
              </ul>
            </div>

            {/* AI Components */}
            {restaurantId && (
              <>
                <div style={{ 
                  marginTop: '30px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #dee2e6',
                  overflow: 'hidden'
                }}>
                  <WasteAnalysis restaurantId={restaurantId} userRole="vendor" />
                </div>

                <div style={{ 
                  marginTop: '30px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #dee2e6',
                  overflow: 'hidden'
                }}>
                  <SalesProfitAdvisor restaurantId={restaurantId} userRole="vendor" />
                </div>

                <div style={{ 
                  marginTop: '30px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #dee2e6',
                  overflow: 'hidden'
                }}>
                  <UpsellSuggestions restaurantId={restaurantId} userRole="vendor" />
                </div>

                <div style={{ 
                  marginTop: '30px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #dee2e6',
                  overflow: 'hidden'
                }}>
                  <SmartLeftoverReuse restaurantId={restaurantId} userRole="vendor" />
                </div>

                <div style={{ 
                  marginTop: '30px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #dee2e6',
                  overflow: 'hidden'
                }}>
                  <InventoryWasteAlert restaurantId={restaurantId} userRole="vendor" />
                </div>
              </>
            )}
          </div>
        );

      case 'inventory':
        return (
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>📦 Inventory Management</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Manage your product inventory, track stock levels, and update product information.
            </p>
            <button 
              onClick={handleInventoryManagement}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#fd7e14', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            >
              Open Inventory Management
            </button>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Inventory Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>Add, edit, and delete inventory items</li>
                <li>Bulk import with voice/text input support</li>
                <li>Track stock levels and set alerts</li>
                <li>Monitor usage patterns and trends</li>
                <li>Generate inventory reports</li>
              </ul>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>📋 Order Tracking</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Track incoming orders, manage delivery schedules, and update order status.
            </p>
            <button 
              onClick={handleOrderTracking}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            >
              Open Order Tracking
            </button>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Order Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>View all incoming orders in real-time</li>
                <li>Update order status and delivery schedules</li>
                <li>Track order history and analytics</li>
                <li>Manage delivery routes and timing</li>
                <li>Generate order reports</li>
              </ul>
            </div>
          </div>
        );

      case 'supplier':
        return (
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>🏢 Supplier Information</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Manage your supplier profile, contact information, and business details.
            </p>
            <button 
              onClick={handleSupplierInfo}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#6f42c1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            >
              Manage Supplier Profile
            </button>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Supplier Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>Update business information and contact details</li>
                <li>Manage product catalog and pricing</li>
                <li>Track delivery performance and ratings</li>
                <li>Communicate with restaurant managers</li>
                <li>Generate supplier reports</li>
              </ul>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>📈 Analytics & Reports</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              View detailed analytics, performance metrics, and business insights.
            </p>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Analytics Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>Sales performance and revenue tracking</li>
                <li>Product popularity and demand analysis</li>
                <li>Delivery performance metrics</li>
                <li>Customer satisfaction ratings</li>
                <li>Business growth trends and forecasts</li>
              </ul>
            </div>
          </div>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: sidebarCollapsed ? '60px' : '180px',
        backgroundColor: '#343a40',
        color: 'white',
        transition: 'width 0.3s ease',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #495057',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!sidebarCollapsed && (
            <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>
              Vendor Dashboard
            </h3>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '5px'
            }}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '20px 0' }}>
          {sidebarItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              style={{
                padding: '15px 20px',
                cursor: 'pointer',
                backgroundColor: activePage === item.id ? item.color : 'transparent',
                borderLeft: activePage === item.id ? `4px solid ${item.color}` : '4px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                transition: 'all 0.3s ease',
                marginBottom: '5px'
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '20px', 
          right: '20px' 
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        marginLeft: sidebarCollapsed ? '60px' : '180px',
        flex: 1,
        transition: 'margin-left 0.3s ease',
        padding: '20px'
      }}>
        {/* Page Header */}
        <div style={{ 
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 5px 0', color: '#495057' }}>
                {sidebarItems.find(item => item.id === activePage)?.label}
              </h1>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                Welcome, {userData?.name} - Vendor Dashboard
              </p>
            </div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: sidebarItems.find(item => item.id === activePage)?.color || '#007bff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <div style={{ transform: 'scale(0.8)' }}>
                {sidebarItems.find(item => item.id === activePage)?.icon}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        {renderPageContent()}
      </div>
    </div>
  );
} 