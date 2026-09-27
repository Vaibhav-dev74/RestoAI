import React, { useState, useEffect } from 'react';
import WasteAnalysis from '../components/WasteAnalysis';
import SalesProfitAdvisor from '../components/SalesProfitAdvisor';
import UpsellSuggestions from '../components/UpsellSuggestions';
import SmartLeftoverReuse from '../components/SmartLeftoverReuse';
import InventoryWasteAlert from '../components/InventoryWasteAlert';
import MonthlySalesGraph from '../components/MonthlySalesGraph';

const DashboardPage = ({ 
  restaurantId, 
  restaurantName, 
  orders, 
  staff, 
  wasteAlerts, 
  inventory,
  setActivePage,
  handleViewQR,
  handleViewUsers,
  handleInventoryManagement,
  handleViewProfile
}) => {
  const [todaysSales, setTodaysSales] = useState(0);

  useEffect(() => {
    const sales = orders
      .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    setTodaysSales(sales);
  }, [orders]);

  const getTrendingDishes = () => {
    const dishCounts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const dishName = item.name;
        dishCounts[dishName] = (dishCounts[dishName] || 0) + item.quantity;
      });
    });
    
    const trendingArray = Object.entries(dishCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return trendingArray;
  };

  const trendingDishes = getTrendingDishes();

  return (
    <div className="manager-dashboard-premium-bg">
      {/* Dashboard content - same as original but extracted */}
      <style>{`
        /* Include all the dashboard CSS styles from original */
      `}</style>
      
      {/* SVG Backgrounds */}
      <svg className="premium-bg-svg top" viewBox="0 0 400 320" fill="none"><ellipse cx="200" cy="160" rx="200" ry="160" fill="#818cf8"/><ellipse cx="120" cy="80" rx="80" ry="60" fill="#fbbf24" fillOpacity="0.7"/></svg>
      <svg className="premium-bg-svg bottom" viewBox="0 0 400 320" fill="none"><ellipse cx="200" cy="160" rx="200" ry="160" fill="#fbbf24"/><ellipse cx="280" cy="240" rx="80" ry="60" fill="#818cf8" fillOpacity="0.7"/></svg>
      
      {/* Dashboard Header */}
      <div className="dashboard-header-premium">
        <div>
          <div className="dashboard-title-premium">Manager Dashboard</div>
          <div style={{fontFamily:'DM Sans,sans-serif',color:'#64748b',fontSize:'1.08rem'}}>Welcome back, manage your restaurant with insights and control.</div>
        </div>
        <div className="dashboard-actions-premium">
          <button className="dashboard-action-btn-premium" onClick={handleViewQR}>View QR</button>
          <button className="dashboard-action-btn-premium" onClick={handleViewUsers}>Manage Users</button>
          <button className="dashboard-action-btn-premium" onClick={handleInventoryManagement}>Inventory</button>
          <button className="dashboard-action-btn-premium" onClick={handleViewProfile}>My Profile</button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="dashboard-kpi-row-premium">
        <div className="dashboard-kpi-card-premium">
          <div className="dashboard-kpi-icon-premium">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div>
            <div className="dashboard-kpi-label-premium">Total Inventory Items</div>
            <div className="dashboard-kpi-value-premium">{Array.isArray(inventory) ? inventory.length : '--'}</div>
          </div>
        </div>
        
        {/* Other KPI cards... */}
      </div>
      
      {/* Main Grid */}
      <div className="dashboard-main-grid-premium">
        <div className="dashboard-artistic-card-premium">
          <div className="dashboard-artistic-header-premium">
            <span>Sales & Profit Advisor</span>
          </div>
          <div className="dashboard-artistic-content-premium">
            <SalesProfitAdvisor restaurantId={restaurantId} userRole="manager" orders={orders} />
          </div>
        </div>
        
        {/* Other dashboard components... */}
      </div>
    </div>
  );
};

export default DashboardPage;