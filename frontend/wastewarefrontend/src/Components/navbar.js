import React from "react";
import { Link } from "react-router-dom";
import "../Styles/Component/navbar.css"; // Navbar CSS in same folder
import "../Styles/Base/colors.css";
import "../Styles/Base/variables.css";
import "../Styles/Base/glass.css";
import { AuthContext } from "./AuthProvider";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
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
  brand = "WasteWare",
  links = [],
  profileImage = "/assets/profile-placeholder.jpg",
}) => {
  const { clearAuth, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
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
  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <i
            className="fa-solid fa-recycle fa-3x navbar-logo-img"
            style={{ color: "#2e7d32" }}
          ></i>
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
