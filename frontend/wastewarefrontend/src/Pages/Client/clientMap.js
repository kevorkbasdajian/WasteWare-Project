import React, { useContext, useEffect } from "react";
import "../../Styles/Page/clientMap.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";

const ClientMap = () => {
  const { clearAuth, accessToken, user_type, userData, isLoadingUser } =
    useContext(AuthContext);

  const navigate = useNavigate();

  const links = [
    {
      name: "Home",
      path: "/client",
      color: "var(--gradient-red)",
      glowColor: "#EF4444",
      icon: "fa-solid fa-house fa-lg",
    },
    {
      name: "Map",
      path: "/client/map",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: "fa-solid fa-map-location-dot fa-lg",
    },
    {
      name: "Report",
      path: "/client/reports",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-camera fa-lg",
    },
  ];

  // ALL HOOKS MUST COME BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (user_type && user_type !== "user") {
      navigate(-1);
    }
  }, [user_type, navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // NOW conditional returns are safe
  if (isLoadingUser) {
    return (
      <div className="loading">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <p>Loading map...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="error-page">
        <p>Unable to load user data</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar
        links={links}
        profilePath="/client/profile"
        profileImage={`http://localhost:8000${userData.avatar}`}
        onLogout={handleLogout}
      />

      <HeaderBox
        text="Interactive Map"
        gradientColors={["#0288D1", "#26C6DA"]}
      />

      <div className="map-container">
        {/* User info panel on map */}
        <div className="map-user-info">
          <img
            src={userData.avatar}
            alt={userData.name}
            className="map-avatar"
          />
          <div className="map-user-details">
            <h3>{userData.name}</h3>
            <p>{userData.stats?.reportsSubmitted || 0} reports submitted</p>
          </div>
        </div>

        {/* Your map implementation here */}
        <div className="map-view">
          {/* Add your map component (Google Maps, Leaflet, etc.) */}
          <div className="map-placeholder">
            <i className="fa-solid fa-map-location-dot fa-3x"></i>
            <p>Map view will be displayed here</p>
            <p className="map-subtitle">
              Showing reports from {userData.city || "your area"}
            </p>
          </div>
        </div>

        {/* Map legend or controls */}
        <div className="map-legend">
          <h4>Legend</h4>
          <div className="legend-item">
            <span className="legend-marker red"></span>
            <span>Critical Issues</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker orange"></span>
            <span>High Priority</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker yellow"></span>
            <span>Medium Priority</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker green"></span>
            <span>Low Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientMap;
