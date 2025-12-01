import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../Styles/Page/Admin/Adminsidebar.css';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items
  const navItems = [
    {
      name: 'Schedule',
      path: '/admin/schedule',
      icon: <i className="fa-solid fa-calendar-days"></i>
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: <i className="fa-solid fa-users"></i>
    },
    {
      name: 'Company',
      path: '/admin/company',
      icon: <i className="fa-solid fa-building"></i>
    },
    {
      name: 'Rewards',
      path: '/admin/rewards',
      icon: <i className="fa-solid fa-award"></i>
    }
  ];

  const handleLogout = () => {
    console.log('Admin logout clicked');
    
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

export default AdminSidebar;