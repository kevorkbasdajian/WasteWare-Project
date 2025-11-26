import React, { useContext, useEffect } from "react";
import "../../Styles/Page/clientMap.css"; // Dashboard CSS in same folder
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";

const ClientMap = () => {
  const { clearAuth, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const links = [
    {
      name: "Home",
      path: "/",
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
    {
      name: "Notifications",
      path: "/company/notifications",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: "fa-solid fa-bell fa-lg",
    },
  ];

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="page">
      <Navbar links={links} profilePath="/client/profile" />
      <HeaderBox
        text="Interactive Map"
        gradientColors={["#0288D1", "#26C6DA"]}
      />
    </div>
  );
};

export default ClientMap;
