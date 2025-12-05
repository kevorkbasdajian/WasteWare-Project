import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthProvider";

import "../Styles/Page/Admin/Adminsidebar.css";

const AdminSidebar = () => {
  const { clearAuth } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  // Navigation items
  const navItems = [
    {
      name: "Users",
      path: "/admin/users",
      icon: <i className="fa-solid fa-users"></i>,
    },
    {
      name: "Company",
      path: "/admin/company",
      icon: <i className="fa-solid fa-building"></i>,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      clearAuth();
      navigate("/Login");
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      // Save state to localStorage
      localStorage.setItem("sidebarCollapsed", newState);
      return newState;
    });
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="hamburger-menu" onClick={toggleSidebar}>
          <i className="fa-solid fa-bars"></i>
        </div>
        {!isCollapsed && <h2 className="sidebar-logo">WasteWare</h2>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-text">{item.name}</span>}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          {isCollapsed ? (
            <i className="fa-solid fa-right-from-bracket"></i>
          ) : (
            "Log Out"
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
