import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/Component/navbar.css';                // Navbar CSS in same folder
import '../Styles/Base/colors.css';
import '../Styles/Base/variables.css';
import '../Styles/Base/glass.css';


/**
 * ===============================================
 * File: Navbar.js
 * Purpose: Reusable navigation bar with customizable
 *          buttons, links, and styles for various user roles.
 * ===============================================
 *
 * Props:
 *  - links: Array of { name, path, color? }
 *  - logo: Path to logo image
 *  - brand: App name (string)
 *  - profileImage: Optional profile image URL
 *  - onLogout: Function to handle logout
 */

const Navbar = ({
  logo = '/assets/logo.png',
  brand = 'WasteWare',
  links = [],
  profileImage = '/assets/profile-placeholder.jpg',
  onLogout = () => {},
}) => {
  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Logo" className="navbar-logo-img" />
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
                  '--hover-color': link.color || 'var(--eco-green)',
                  '--glow-color': link.glowColor || '#2E7D32',
                }}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>



        {/* Profile & Logout */}
        <div className="navbar-actions">
          <Link to="/profile">
            <img
              src={profileImage}
              alt="Profile"
              className="navbar-profile"
            />
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
