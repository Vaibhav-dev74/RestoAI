// pages/CustomerOrderDetails.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  Home,
  Star,
  IndianRupee,
  Calendar,
  Printer,
  Share2,
  Download,
  Utensils,
  User,
  Phone,
  Mail,
  Receipt,
  CreditCard,
  Smartphone,
  Wallet,
  Copy,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

const CustomerOrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  
  const { orderId } = useParams();
  const navigate = useNavigate();
  const VITE_API_URL = API_BASE_URL;

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchOrderDetails(orderId, userData._id);
    } else {
      // Redirect to login if not logged in
      navigate('/customer-login');
    }
  }, [orderId]);

  const fetchOrderDetails = async (orderId, customerId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch order with customer verification
      const response = await axios.get(
        `${VITE_API_URL}/api/orders/${orderId}?customerId=${customerId}`,
        { headers }
      );

      setOrder(response.data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      if (err.response?.status === 404) {
        setError('Order not found or you don\'t have permission to view it.');
      } else {
        setError('Failed to load order details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'served': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock size={20} />;
      case 'preparing': return <Package size={20} />;
      case 'served': return <Truck size={20} />;
      case 'paid': return <CheckCircle size={20} />;
      case 'cancelled': return <AlertCircle size={20} />;
      default: return <ShoppingBag size={20} />;
    }
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return <Wallet size={18} />;
      case 'card': return <CreditCard size={18} />;
      case 'upi': return <Smartphone size={18} />;
      case 'online': return <Receipt size={18} />;
      default: return <CreditCard size={18} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateSubtotal = () => {
    return order?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.05; // 5% tax
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order from ${order?.restaurant?.name}`,
          text: `Check out my order from ${order?.restaurant?.name}! Total: ₹${order?.totalAmount}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled:', err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getTimelineSteps = () => {
    const steps = [
      { status: 'pending', label: 'Order Placed', icon: <ShoppingBag size={18} /> },
      { status: 'preparing', label: 'Preparing', icon: <Package size={18} /> },
      { status: 'served', label: 'Served', icon: <Truck size={18} /> },
      { status: 'paid', label: 'Completed', icon: <CheckCircle size={18} /> },
    ];

    const currentIndex = steps.findIndex(step => step.status === order?.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex && order?.status !== 'cancelled',
      active: index === currentIndex && order?.status !== 'cancelled',
      cancelled: order?.status === 'cancelled'
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-600 animate-pulse">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Something went wrong'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Back to Orders
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeline = getTimelineSteps();
  const subtotal = calculateSubtotal();
  const tax = calculateTax();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Artistic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/orders')}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Order Details</h1>
                <p className="text-sm text-gray-500">Order #{order._id.slice(-8)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Print"
              >
                <Printer size={18} className="text-gray-600" />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Share"
              >
                <Share2 size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Restaurant Header */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-48 bg-gradient-to-r from-orange-500 to-pink-500">
                <img 
                  src={order.restaurant?.image || 'https://source.unsplash.com/1200x400/?restaurant'}
                  alt={order.restaurant?.name}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white mb-2">{order.restaurant?.name}</h2>
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span>{order.restaurant?.location?.city || 'Location not specified'}</span>
                    </div>
                    {order.restaurant?.cuisine && (
                      <div className="flex items-center gap-1">
                        <Utensils size={16} />
                        <span>{order.restaurant.cuisine.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Status Banner */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order Status</p>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)} flex items-center gap-2`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTime(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-orange-500 flex items-center justify-end">
                      <IndianRupee size={20} />
                      {order.totalAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              {showTimeline && order.status !== 'cancelled' && (
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Order Timeline</h3>
                    <button
                      onClick={() => setShowTimeline(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-500"
                        style={{ 
                          width: `${timeline.filter(t => t.completed).length * 33.33}%` 
                        }}
                      ></div>
                    </div>

                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {timeline.map((step, index) => (
                        <div key={step.status} className="text-center">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto
                            ${step.cancelled 
                              ? 'bg-red-100 text-red-500' 
                              : step.completed 
                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' 
                                : 'bg-gray-100 text-gray-400'
                            }
                          `}>
                            {step.icon}
                          </div>
                          <p className={`
                            text-xs font-medium
                            ${step.cancelled 
                              ? 'text-red-500' 
                              : step.active 
                                ? 'text-orange-500' 
                                : step.completed 
                                  ? 'text-gray-700' 
                                  : 'text-gray-400'
                            }
                          `}>
                            {step.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      {/* Item Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white">
                        <img 
                          src={item.image || `https://source.unsplash.com/100x100/?food,${item.name}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-gray-800">{item.name}</h4>
                          <span className="font-bold text-orange-500 flex items-center">
                            <IndianRupee size={14} />
                            {item.price * item.quantity}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-2">
                          ₹{item.price} × {item.quantity}
                        </p>

                        {item.modifications && item.modifications.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.modifications.map((mod, idx) => (
                              <span key={idx} className="text-xs bg-white px-2 py-1 rounded-lg text-gray-600">
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {order.specialInstructions && (
                <div className="p-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-2">Special Instructions</h3>
                  <p className="text-gray-600 bg-yellow-50 p-4 rounded-xl">
                    {order.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Payment Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-700 flex items-center">
                    <IndianRupee size={14} />
                    {subtotal}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax (5%)</span>
                  <span className="font-medium text-gray-700 flex items-center">
                    <IndianRupee size={14} />
                    {tax.toFixed(2)}
                  </span>
                </div>
                {order.deliveryAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium text-green-500">Free</span>
                  </div>
                )}
                <div className="border-t border-gray-200 my-3 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-orange-500 flex items-center">
                      <IndianRupee size={16} />
                      {order.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(order.paymentMethod)}
                    <span className="font-medium capitalize text-gray-700">
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Order ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-600">
                      {order._id.slice(-12)}
                    </span>
                    <button
                      onClick={handleCopyOrderId}
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                      title="Copy Order ID"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                {copied && (
                  <p className="text-xs text-green-500 mt-2">Order ID copied!</p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Delivery Address</h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">{user?.name}</p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryAddress.street}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                  </p>
                  {order.deliveryAddress.landmark && (
                    <p className="text-sm text-gray-500">
                      Landmark: {order.deliveryAddress.landmark}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                    <Phone size={14} />
                    {user?.phone || 'Phone not available'}
                  </p>
                </div>
              </div>
            )}

            {/* Restaurant Contact */}
            {order.restaurant?.phone && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Restaurant Contact</h3>
                <div className="space-y-3">
                  <a 
                    href={`tel:${order.restaurant.phone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Phone size={18} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Call Restaurant</p>
                      <p className="font-medium text-gray-800">{order.restaurant.phone}</p>
                    </div>
                  </a>

                  {order.restaurant.email && (
                    <a 
                      href={`mailto:${order.restaurant.email}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <Mail size={18} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Restaurant</p>
                        <p className="font-medium text-gray-800">{order.restaurant.email}</p>
                      </div>
                    </a>
                  )}

                  <a 
                    href={`https://maps.google.com/?q=${order.restaurant.location?.coordinates?.join(',')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <ExternalLink size={18} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Get Directions</p>
                      <p className="font-medium text-gray-800">Open in Maps</p>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Need Help */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Need Help?</h3>
              <div className="space-y-3">
                <Link 
                  to="/support"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <HelpCircle size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Customer Support</p>
                    <p className="text-sm text-gray-500">Get help with your order</p>
                  </div>
                </Link>

                <Link 
                  to={`/restaurant/${order.restaurant?._id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <ShoppingBag size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Order Again</p>
                    <p className="text-sm text-gray-500">From same restaurant</p>
                  </div>
                </Link>

                <button 
                  onClick={() => {
                    const text = `I have a question about my order #${order._id.slice(-8)}`;
                    window.open(`https://wa.me/${order.restaurant?.phone || '1234567890'}?text=${encodeURIComponent(text)}`);
                  }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group w-full text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <MessageCircle size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">WhatsApp Support</p>
                    <p className="text-sm text-gray-500">Chat with restaurant</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          header, footer, button, .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerOrderDetails;