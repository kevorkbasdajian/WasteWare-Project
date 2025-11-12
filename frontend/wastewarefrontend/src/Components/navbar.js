import React from "react";
import { Link } from "react-router-dom";
import "../Styles/Component/navbar.css"; // Navbar CSS in same folder
import "../Styles/Base/colors.css";
import "../Styles/Base/variables.css";
import "../Styles/Base/glass.css";
import { useFetchWithAuth } from "./fetchWithAuth";
/**
 * ===============================================
 * File: Navbar.js
 * Purpose: Reusable navigation bar with customizable
 *          buttons, links, and styles for various user roles.
 * ===============================================
 *
 * Props:
 *  - links: Array of { name, path, color? }
 *  - brand: App name (string)
 *  - profileImage: Optional profile image URL
 *  - onLogout: Function to handle logout
 */

const Navbar = ({
  brand = "WasteWare",
  links = [],
  profileImage = "/assets/profile-placeholder.jpg",
  onLogout = () => {},
}) => {
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <i className="fa-solid fa-recycle fa-2x navbar-logo-img" style={{color: "#2e7d32"}}></i>
          <span className="navbar-title">{brand}</span>
        </Link>

        {/* Dynamic Links */}
        <ul className="navbar-links">
          {links.map((link, index) => (
            <li key={index}>
              <Link
                to={link.path}
                className="navbar-link"
                style={{
                  "--hover-color": link.color || "var(--eco-green)",
                  "--glow-color": link.glowColor || "#2E7D32",
                }}
              >
                {[link.icon, link.name]}
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
          
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;