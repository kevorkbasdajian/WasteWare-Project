import React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // Add useLocation
import "../Styles/Component/navbar.css";
import "../Styles/Base/colors.css";
import "../Styles/Base/variables.css";
import "../Styles/Base/glass.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import { useContext } from "react";

/**
 * ===============================================
 * File: Navbar.js
 * Purpose: Reusable navigation bar with customizable
 *          buttons, links, and styles for various user roles.
 * ===============================================
 *
 * Props:
 *  - links: Array of { name, path, color?, glowColor?, icon? }
 *  - brand: App name (string)
 *  - profileImage: Optional profile image URL
 *  - onLogout: Function to handle logout
 */

const Navbar = ({
  brand = "WasteWare",
  links = [],
  profileImage = "/assets/profile-placeholder.jpg",
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation(); // Get current route
  const navigate = useNavigate();
  const { clearAuth, accessToken } = useContext(AuthContext);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  };

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

  // Check if link is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <i
            className="fa-solid fa-recycle fa-2x navbar-logo-img"
            style={{ color: "#2e7d32" }}
          ></i>
          <span className="navbar-title">{brand}</span>
        </Link>

        {/* Dynamic Links */}
        <ul className="navbar-links">
          {links.map((link, index) => (
            <li key={link.path}>
              {" "}
              {/* Use path as key for better performance */}
              <Link
                to={link.path}
                className={`navbar-link ${
                  isActiveLink(link.path) ? "active" : ""
                }`}
                style={{
                  "--hover-color": link.color || "var(--eco-green)",
                  "--glow-color": link.glowColor || "#2E7D32",
                }}
              >
                {link.icon && <i className={link.icon}></i>}
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Profile & Logout */}
        <div className="navbar-actions">
          {/* Dark Mode Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <i className="fa-solid fa-sun"></i>
            ) : (
              <i className="fa-solid fa-moon"></i>
            )}
          </button>

          <Link to="/profile">
            <img src={profileImage} alt="Profile" className="navbar-profile" />
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
