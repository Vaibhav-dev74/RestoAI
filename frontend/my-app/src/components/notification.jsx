// components/NotificationBell.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './NotificationBell.css';
import { API_BASE_URL } from '../config/apiBaseUrl';

const SOCKET_URL = API_BASE_URL;

export default function NotificationBell({ restaurantId, inline = false }) {
  const INR = '\u20B9';
  const [urgentOrders, setUrgentOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Normalize legacy statuses into the canonical backend enum values.
  const normalizeStatus = (status) => {
    switch (status) {
      case 'processing':
        return 'preparing';
      case 'ready':
        return 'served';
      case 'received':
      case 'completed':
        return 'paid';
      default:
        return status;
    }
  };

  // Fetch urgent orders that haven't been received within 10 minutes
  const fetchUrgentOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/api/orders/urgent`, { headers });
      
      // Filter orders that are still pending/processing and not yet received
      const urgent = response.data.filter(order => {
        const orderTime = new Date(order.createdAt);
        const currentTime = new Date();
        const timeDiff = (currentTime - orderTime) / (1000 * 60); // in minutes

        const status = normalizeStatus(order.status);
        
        // Check if order is > 10 minutes old and not yet received
        const isUrgent =
          timeDiff > 10 &&
          ['pending', 'preparing', 'served'].includes(status);
        
        return isUrgent;
      });

      setUrgentOrders(urgent);
      
      // Update unread count (only count new ones not previously shown)
      const newUrgentIds = urgent.map(o => o._id);
      const storedIds = JSON.parse(localStorage.getItem('urgentOrderIds') || '[]');
      const newUnread = newUrgentIds.filter(id => !storedIds.includes(id));
      setUnreadCount(newUnread.length);
      
      // Store IDs to prevent repeated notifications
      if (newUnread.length > 0) {
        localStorage.setItem('urgentOrderIds', JSON.stringify([...storedIds, ...newUnread]));
      }

    } catch (error) {
      console.error('Error fetching urgent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_BASE_URL}/api/orders/${orderId}`, 
        { status: newStatus }, 
        { headers }
      );
      
      // Refresh urgent orders after status update
      await fetchUrgentOrders();
      
      // Show success message
      alert(`Order ${orderId.slice(-6)} marked as ${getStatusName(newStatus)}`);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const s = normalizeStatus(status);
    const colors = {
      pending: '#fbbf24',
      preparing: '#f59e0b',
      served: '#10b981',
      paid: '#6b7280',
      cancelled: '#ef4444'
    };
    return colors[s] || '#6b7280';
  };

  // Get status display name
  const getStatusName = (status) => {
    const s = normalizeStatus(status);
    const names = {
      pending: 'Pending',
      preparing: 'Preparing',
      served: 'Ready',
      paid: 'Paid',
      cancelled: 'Cancelled'
    };
    return names[s] || s;
  };

  // Get time elapsed
  const getTimeElapsed = (createdAt) => {
    const orderTime = new Date(createdAt);
    const currentTime = new Date();
    const diffMinutes = Math.floor((currentTime - orderTime) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m ago`;
    }
    return `${diffMinutes} minutes ago`;
  };

  // Get urgency level
  const getUrgencyLevel = (createdAt) => {
    const orderTime = new Date(createdAt);
    const currentTime = new Date();
    const diffMinutes = (currentTime - orderTime) / (1000 * 60);
    
    if (diffMinutes > 30) return 'critical';
    if (diffMinutes > 20) return 'high';
    if (diffMinutes > 10) return 'medium';
    return 'normal';
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!restaurantId) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Join restaurant-specific room
    newSocket.emit('join:restaurant', restaurantId);

    // Listen for urgent orders
    newSocket.on('urgent:orders', (orders) => {
      console.log('Received urgent orders via WebSocket:', orders);
      setUrgentOrders(prevOrders => {
        // Merge with existing orders, avoid duplicates
        const orderMap = new Map();
        [...prevOrders, ...orders].forEach(order => {
          orderMap.set(order._id, order);
        });
        const mergedOrders = Array.from(orderMap.values());
        
        // Update unread count for new orders
        const newOrderIds = orders.map(o => o._id);
        const storedIds = JSON.parse(localStorage.getItem('urgentOrderIds') || '[]');
        const newUnread = newOrderIds.filter(id => !storedIds.includes(id));
        
        if (newUnread.length > 0) {
          setUnreadCount(prev => prev + newUnread.length);
          localStorage.setItem('urgentOrderIds', JSON.stringify([...storedIds, ...newUnread]));
        }
        
        return mergedOrders;
      });
    });

    // Listen for urgent alerts
    newSocket.on('urgent:alert', (alert) => {
      console.log('Urgent alert:', alert);
      if (alert.count > 0 && !showModal) {
        setUnreadCount(prev => prev + alert.count);
        
        // Play sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification(`⚠️ ${alert.count} Urgent Order${alert.count > 1 ? 's' : ''}`, {
            body: `${alert.count} order${alert.count > 1 ? 's are' : ' is'} waiting for more than 10 minutes!`,
            icon: '/urgent-icon.png'
          });
        }
      }
    });

    return () => {
      newSocket.emit('leave:restaurant', restaurantId);
      newSocket.disconnect();
    };
  }, [restaurantId, showModal]);

  // Auto-refresh every 30 seconds (fallback if WebSocket fails)
  useEffect(() => {
    fetchUrgentOrders();
    
    const interval = setInterval(() => {
      fetchUrgentOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [restaurantId]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Mark all as read when modal opens
  const handleOpenModal = () => {
    setShowModal(true);
    setUnreadCount(0);
    // Store current order IDs as read
    localStorage.setItem('urgentOrderIds', JSON.stringify(urgentOrders.map(o => o._id)));
  };

  return (
    <>
      {/* Bell Icon - Fixed z-index */}
      <div 
        className="notification-bell" 
        onClick={handleOpenModal}
        style={{
          zIndex: 9999,
          ...(inline
            ? {
                position: 'relative',
                top: 'auto',
                right: 'auto',
                width: 40,
                height: 40,
                boxShadow: 'none',
              }
            : null),
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="notification-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <h2>
                <span className="urgent-icon">⚠️</span>
                Urgent Orders
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="notification-modal-body">
              {loading ? (
                <div className="loading-spinner">Loading urgent orders...</div>
              ) : urgentOrders.length === 0 ? (
                <div className="no-orders">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <p>No urgent orders! All orders are being handled on time.</p>
                </div>
              ) : (
                <div className="urgent-orders-list">
                  {urgentOrders.map((order) => {
                    const urgencyLevel = getUrgencyLevel(order.createdAt);
                    const elapsedTime = getTimeElapsed(order.createdAt);
                    const status = normalizeStatus(order.status);
                    
                    return (
                      <div key={order._id} className={`urgent-order-card ${urgencyLevel}`}>
                        <div className="order-header">
                          <div className="order-info">
                            <span className="order-id">Order #{order._id.slice(-6)}</span>
                            <span className="status-badge" style={{ backgroundColor: getStatusColor(status) }}>
                              {getStatusName(status)}
                            </span>
                          </div>
                          <div className="order-time">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            {elapsedTime}
                          </div>
                        </div>

                        <div className="order-details">
                          <div className="table-info">
                            <strong>Table:</strong> {order.table || 'N/A'}
                          </div>
                          <div className="items-list">
                            <strong>Items:</strong>
                            <ul>
                              {order.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.quantity}x {item.name}
                                  {item.modifications?.length > 0 && (
                                    <span className="modifications"> ({item.modifications.join(', ')})</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="order-total">
                            <strong>Total:</strong> {INR}{order.totalAmount}
                          </div>
                          {order.customer && (
                            <div className="customer-info">
                              <strong>Customer:</strong> {order.customer.name}
                            </div>
                          )}
                        </div>

                        <div className="order-actions">
                          {status === 'pending' && (
                            <button 
                              className="action-btn processing"
                              onClick={() => updateOrderStatus(order._id, 'preparing')}
                            >
                              Start Preparing
                            </button>
                          )}
                          {status === 'preparing' && (
                            <button 
                              className="action-btn ready"
                              onClick={() => updateOrderStatus(order._id, 'served')}
                            >
                              Mark as Ready
                            </button>
                          )}
                          {status === 'served' && (
                            <button 
                              className="action-btn received"
                              onClick={() => updateOrderStatus(order._id, 'paid')}
                            >
                              Mark as Paid
                            </button>
                          )}
                          <button 
                            className="action-btn view"
                            onClick={() => window.open(`/orders/${order._id}`, '_blank')}
                          >
                            View Details
                          </button>
                        </div>

                        {urgencyLevel === 'critical' && (
                          <div className="urgent-warning critical">
                            ⚠️ CRITICAL: This order has been waiting for over 30 minutes! Immediate attention required!
                          </div>
                        )}
                        {urgencyLevel === 'high' && (
                          <div className="urgent-warning high">
                            ⏰ HIGH PRIORITY: Order pending for over 20 minutes! Priority attention needed.
                          </div>
                        )}
                        {urgencyLevel === 'medium' && (
                          <div className="urgent-warning medium">
                            ⚠️ Order has been waiting for over 10 minutes. Please attend soon.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="notification-modal-footer">
              <button className="refresh-btn" onClick={fetchUrgentOrders}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Refresh
              </button>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}