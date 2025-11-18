import React, { useContext, useEffect } from "react";
import "../Styles/Page/clientDashboard.css"; // Dashboard CSS in same folder
import Navbar from "../Components/navbar.js"; // Component import
import { AuthContext } from "../Components/AuthProvider";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { clearAuth, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const links = [
    {
      name: "Home",
      path: "/",
      color: "var(--gradient-red)",
      glowColor: "#EF4444",
      icon: <i className="fa-solid fa-house fa-lg" />,
    },
    {
      name: "Map",
      path: "/map",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: <i className="fa-solid fa-map-location-dot fa-lg" />,
    },
    {
      name: "Report",
      path: "/report",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: <i className="fa-solid fa-camera fa-lg" />,
    },
    {
      name: "Rewards",
      path: "/rewards",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: <i className="fa-solid fa-gift fa-lg" />,
    },
    {
      name: "Profile",
      path: "/profile",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: <i className="fa-solid fa-user fa-lg" />,
    },
  ];

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate, accessToken]);

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
    <div className="page">
      <Navbar links={links} onLogout={handleLogout} />
      <main className="dashboard-content">
        <h1>Dashboard Content</h1>
      </main>
    </div>
  );
};

export default Dashboard;
