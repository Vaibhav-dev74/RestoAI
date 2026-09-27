import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import io from 'socket.io-client';

// Add Google Fonts
const fontLinks = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
];
fontLinks.forEach(link => {
  if (!document.querySelector(`link[href="${link}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = link;
    document.head.appendChild(l);
  }
});
const API_URL = import.meta.env.VITE_API_URL ;
const SOCKET_URL = API_URL;

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [dishesError, setDishesError] = useState('');
  const [user, setUser] = useState(null);
  const [checkingLink, setCheckingLink] = useState(true);
  const navigate = useNavigate();
  const [modalOrder, setModalOrder] = useState(null);
  const [modalNote, setModalNote] = useState('');
  const [sortOrder, setSortOrder] = useState('oldest');
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API_URL}/api/auth/me`, { headers });
        setUser(res.data.user);
        if (!res.data.user.restaurant) {
          navigate('/join');
        }
      } catch (err) {
        navigate('/');
      } finally {
        setCheckingLink(false);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
    fetchDishes();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    
    const socket = io(SOCKET_URL);
    socket.on('order:new', (order) => {
      setOrders(prev => [...prev, order]);
    });
    socket.on('order:update', (updatedOrder) => {
      setOrders(prev => prev.map(order => order._id === updatedOrder._id ? updatedOrder : order));
    });
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/api/orders`, { headers });
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchDishes = async () => {
    setDishesLoading(true);
    setDishesError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/api/orders/dishes`, { headers });
      setDishes(res.data);
    } catch (err) {
      setDishesError('Could not load dishes');
    } finally {
      setDishesLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_URL}/api/orders/${orderId}`, { status: newStatus }, { headers });
      fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'served': return 'Ready';
      case 'paid': return 'Completed';
      default: return status;
    }
  };

  const getOrderAge = (createdAt) => {
    if (!createdAt) return '';
    const min = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (min < 1) return 'Just now';
    if (min === 1) return '1 min ago';
    return `${min} min ago`;
  };

  const getUrgentOrders = () => {
    return orders.filter(order => {
      const age = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
      return age > 15 && (order.status === 'pending' || order.status === 'preparing');
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const filteredOrders = orders.filter(order => 
    activeTab === 'active' 
      ? (order.status === 'pending' || order.status === 'preparing')
      : (order.status === 'served' || order.status === 'paid')
  ).sort((a, b) => 
    sortOrder === 'oldest' 
      ? new Date(a.createdAt) - new Date(b.createdAt) 
      : new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (checkingLink) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Checking restaurant link...</div>
      </div>
    );
  }

  if (!user || !user.restaurant) {
    return null;
  }

  const urgentOrders = getUrgentOrders();

  return (
    <div className={`kitchen-dashboard ${darkMode ? 'dark' : 'light'} ${isMobile ? 'mobile' : 'desktop'}`}>
      <style jsx>{`
        .kitchen-dashboard {
          min-height: 100vh;
          background: var(--bg-gradient);
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
        }

        .light {
          --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          --card-bg: rgba(255, 255, 255, 0.95);
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --text-muted: #94a3b8;
          --border-color: rgba(226, 232, 240, 0.8);
          --shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          --shadow-hover: 0 12px 48px rgba(0, 0, 0, 0.12);
        }

        .dark {
          --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          --card-bg: rgba(30, 41, 59, 0.95);
          --text-primary: #f1f5f9;
          --text-secondary: #cbd5e1;
          --text-muted: #64748b;
          --border-color: rgba(51, 65, 85, 0.8);
          --shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          --shadow-hover: 0 12px 48px rgba(0, 0, 0, 0.4);
        }

        /* Mobile First Styles */
        .dashboard-header {
          padding: 16px;
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-top {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .header-titles {
          flex: 1;
        }

        .header-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .header-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-btn {
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-primary);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .control-btn:hover {
          background: var(--border-color);
        }

        .logout-btn {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          font-size: 12px;
        }

        .logout-btn:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: var(--card-bg);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow);
          text-align: center;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .stat-label {
          font-size: 10px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .urgent-stat {
          background: linear-gradient(135deg, #fef3c7, #fbbf24);
        }

        .urgent-stat .stat-value,
        .urgent-stat .stat-label {
          color: #92400e;
        }

        .tabs-container {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: var(--border-color);
          padding: 4px;
          border-radius: 8px;
        }

        .tab {
          flex: 1;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .tab.active {
          background: #6366f1;
          color: white;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          padding: 16px;
        }

        .order-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .order-card:hover {
          box-shadow: var(--shadow-hover);
          transform: translateY(-1px);
        }

        .order-card.urgent {
          border-left: 4px solid #f59e0b;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 8px;
        }

        .order-meta {
          flex: 1;
        }

        .order-table {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .order-time {
          font-size: 12px;
          color: var(--text-secondary);
          font-family: 'JetBrains Mono', monospace;
        }

        .order-status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .status-pending { background: #fef3c7; color: #92400e; }
        .status-preparing { background: #e0e7ff; color: #3730a3; }
        .status-served { background: #d1fae5; color: #065f46; }
        .status-paid { background: #e5e7eb; color: #374151; }

        .order-items {
          margin-bottom: 16px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 6px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 2px;
          font-size: 14px;
        }

        .item-mods {
          font-size: 11px;
          color: var(--text-muted);
          font-style: italic;
        }

        .item-qty {
          font-weight: 600;
          color: var(--text-primary);
          margin-left: 4px;
        }

        .item-price {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .order-actions {
          display: flex;
          gap: 6px;
        }

        .action-btn {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .action-btn.primary {
          background: #6366f1;
          color: white;
        }

        .action-btn.primary:hover {
          background: #4f46e5;
        }

        .action-btn.secondary {
          background: var(--border-color);
          color: var(--text-primary);
        }

        .action-btn.secondary:hover {
          background: var(--text-muted);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: var(--text-secondary);
          font-size: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .urgent-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #f59e0b;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal-content {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 20px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-hover);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .items-section {
          margin: 16px 0;
        }

        .items-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: var(--text-primary);
        }

        .modal-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 6px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-item:last-child {
          border-bottom: none;
        }

        .modal-item-name {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 14px;
        }

        .modal-item-mods {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
          margin-top: 2px;
        }

        .modal-item-price {
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .notes-section {
          margin-top: 16px;
        }

        .notes-section label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 14px;
        }

        .notes-section textarea {
          width: 100%;
          min-height: 80px;
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--card-bg);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          resize: vertical;
        }

        .save-notes-btn {
          width: 100%;
          padding: 10px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          margin-top: 8px;
        }

        /* Tablet Styles */
        @media (min-width: 768px) {
          .dashboard-header {
            padding: 24px 32px;
          }

          .header-top {
            flex-direction: row;
            align-items: center;
            margin-bottom: 24px;
          }

          .header-content {
            flex-direction: row;
            align-items: center;
          }

          .header-title {
            font-size: 28px;
          }

          .header-controls {
            gap: 12px;
          }

          .control-btn {
            padding: 8px 16px;
            font-size: 14px;
          }

          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }

          .stat-card {
            padding: 20px;
            border-radius: 12px;
          }

          .stat-value {
            font-size: 24px;
          }

          .stat-label {
            font-size: 14px;
          }

          .tabs-container {
            gap: 8px;
            margin-bottom: 24px;
            padding: 4px;
          }

          .tab {
            padding: 12px 24px;
            font-size: 14px;
          }

          .orders-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            padding: 0 32px 32px;
          }

          .order-card {
            padding: 24px;
            border-radius: 16px;
          }

          .order-table {
            font-size: 18px;
          }

          .order-time {
            font-size: 14px;
          }

          .order-status {
            padding: 6px 12px;
            font-size: 12px;
          }

          .item-name {
            font-size: 16px;
          }

          .action-btn {
            padding: 10px 16px;
            font-size: 14px;
          }
        }

        /* Desktop Styles */
        @media (min-width: 1024px) {
          .orders-grid {
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          }

          .header-title {
            font-size: 32px;
          }
        }

        /* Large Desktop Styles */
        @media (min-width: 1440px) {
          .orders-grid {
            grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
            max-width: 1400px;
            margin: 0 auto;
          }
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-top">
          <div className="header-content">
            <div className="header-titles">
              <h1 className="header-title">Kitchen Dashboard</h1>
              <p className="header-subtitle">Real-time order management</p>
            </div>
            <div className="header-controls">
              <button className="control-btn" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
              <button className="control-btn logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">
              {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}
            </div>
            <div className="stat-label">Active Orders</div>
          </div>
          <div className="stat-card urgent-stat">
            <div className="stat-value">{urgentOrders.length}</div>
            <div className="stat-label">Urgent Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {orders.filter(o => o.status === 'served' || o.status === 'paid').length}
            </div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Orders
          </button>
          <button 
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Order History
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {ordersLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>No {activeTab === 'active' ? 'active' : 'completed'} orders</h3>
          <p>Orders will appear here as they come in</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => {
            const isUrgent = urgentOrders.some(urgent => urgent._id === order._id);
            const orderAge = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            
            return (
              <div key={order._id} className={`order-card ${isUrgent ? 'urgent' : ''}`}>
                {isUrgent && <div className="urgent-badge">Urgent</div>}
                
                <div className="order-header">
                  <div className="order-meta">
                    <div className="order-table">Table {order.table}</div>
                    <div className="order-time">{getOrderAge(order.createdAt)} • {orderAge} min</div>
                  </div>
                  <div className={`order-status status-${order.status}`}>
                    {getStatusLabel(order.status)}
                  </div>
                </div>

                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-info">
                        <div className="item-name">
                          {item.name}
                          <span className="item-qty">×{item.quantity}</span>
                        </div>
                        {item.modifications && item.modifications.length > 0 && (
                          <div className="item-mods">{item.modifications.join(', ')}</div>
                        )}
                      </div>
                      <div className="item-price">₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>

                {activeTab === 'active' && (
                  <div className="order-actions">
                    {order.status === 'pending' && (
                      <button 
                        className="action-btn primary"
                        onClick={() => updateOrderStatus(order._id, 'preparing')}
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        className="action-btn primary"
                        onClick={() => updateOrderStatus(order._id, 'served')}
                      >
                        Mark Ready
                      </button>
                    )}
                    <button 
                      className="action-btn secondary"
                      onClick={() => { setModalOrder(order); setModalNote(order.note || ''); }}
                    >
                      Details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {modalOrder && (
        <div className="modal-overlay" onClick={() => setModalOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="modal-close" onClick={() => setModalOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span>Table:</span>
                <span>{modalOrder.table}</span>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <span className={`status status-${modalOrder.status}`}>
                  {getStatusLabel(modalOrder.status)}
                </span>
              </div>
              <div className="detail-row">
                <span>Order Time:</span>
                <span>{getOrderAge(modalOrder.createdAt)}</span>
              </div>
              <div className="items-section">
                <h3>Items</h3>
                {modalOrder.items.map((item, index) => (
                  <div key={index} className="modal-item">
                    <div className="modal-item-name">
                      {item.name} ×{item.quantity}
                    </div>
                    {item.modifications && item.modifications.length > 0 && (
                      <div className="modal-item-mods">
                        {item.modifications.join(', ')}
                      </div>
                    )}
                    <div className="modal-item-price">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>
              <div className="notes-section">
                <label>Staff Notes</label>
                <textarea 
                  value={modalNote}
                  onChange={e => setModalNote(e.target.value)}
                  placeholder="Add notes for this order..."
                />
                <button 
                  className="save-notes-btn"
                  onClick={() => {
                    // Implement save note functionality
                    setModalOrder(null);
                  }}
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}