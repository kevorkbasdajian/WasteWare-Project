import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../Styles/Page/Admin/Adminsidebar.css';

const CompanySidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items for Company users
  const navItems = [
    {
      name: 'Home',
      path: '/company/home',
      icon: <i className="fa-solid fa-house"></i>
    },
    {
      name: 'Routes',
      path: '/company/routes',
      icon: <i className="fa-solid fa-route"></i>
    },
    {
      name: 'Schedule',
      path: '/company/schedule',
      icon: <i className="fa-solid fa-calendar-days"></i>
    },
    {
      name: 'Notifications',
      path: '/company/notifications',
      icon: <i className="fa-solid fa-bell"></i>
    },
    {
      name: 'Reports',
      path: '/company/reports',
      icon: <i className="fa-solid fa-chart-line"></i>
    },
    {
      name: 'Marketplace',
      path: '/company/marketplace',
      icon: <i className="fa-solid fa-store"></i>
    },
    {
      name: 'Profile',
      path: '/company/profile',
      icon: <i className="fa-solid fa-user"></i>
    }
  ];

  const handleLogout = () => {
    console.log('Company logout clicked');
    
    // ============ REAL LOGOUT (COMMENTED OUT - USE LATER) ============
    // localStorage.removeItem('access_token');
    // localStorage.removeItem('refresh_token');
    // navigate('/login');
    // ==================================================================
  };

  return (
    <div className="admin-sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="hamburger-menu">
          <i className="fa-solid fa-bars"></i>
        </div>
        <h2 className="sidebar-logo">WasteWare</h2>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default CompanySidebar;