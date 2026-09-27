import React from 'react';

const Sidebar = ({ 
  activePage, 
  sidebarCollapsed, 
  restaurantName, 
  onPageChange, 
  onToggleCollapse, 
  onLogout 
}) => {
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
      id: 'orders', 
      label: 'Orders', 
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
      id: 'orderstatus', 
      label: 'Order Status', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
      ), 
      color: '#6366f1' 
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
      id: 'attendance', 
      label: 'Staff Attendance', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ), 
      color: '#6f42c1' 
    },
    { 
      id: 'tables', 
      label: 'Tables & Reservations', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      ), 
      color: '#17a2b8' 
    },
    { 
      id: 'traceability', 
      label: 'Traceability & Safety', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ), 
      color: '#343a40' 
    },
    { 
      id: 'dynamicpricing', 
      label: 'Dynamic Pricing', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ), 
      color: '#ffc107' 
    },
    { 
      id: 'foodsecurity', 
      label: 'Food Security Grid', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6"/>
          <path d="M21 12h-6m-6 0H3"/>
          <path d="M3.5 3.5l4.5 4.5m0 0l4.5 4.5"/>
          <path d="M20.5 3.5l-4.5 4.5m0 0l-4.5 4.5"/>
        </svg>
      ), 
      color: '#28a745' 
    }
  ];

  return (
    <div className="manager-sidebar">
      <div className="manager-sidebar-header">
        {!sidebarCollapsed && (
          <h3 className="manager-sidebar-title">{restaurantName}</h3>
        )}
        <button
          onClick={onToggleCollapse}
          className="manager-sidebar-collapse"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="manager-sidebar-nav">
        {sidebarItems.map((item) => (
          <div
            key={item.id}
            className={`manager-sidebar-item${activePage === item.id ? ' manager-sidebar-item-active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <span className="manager-sidebar-icon">{item.icon}</span>
            {!sidebarCollapsed && (
              <span className="manager-sidebar-label">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
      
      <div className="manager-sidebar-logout-wrap">
        <button
          onClick={onLogout}
          className="manager-sidebar-logout"
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
  );
};

export default Sidebar;