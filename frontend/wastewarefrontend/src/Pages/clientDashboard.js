import React, { useContext } from "react";
import "../Styles/Page/clientDashboard.css"; // Dashboard CSS in same folder
import Navbar from "../Components/navbar.js"; // Component import
import { useFetchWithAuth } from "../Components/fetchWithAuth";
import { AuthContext } from "../Components/AuthProvider";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const fetchWithAuth = useFetchWithAuth();
  const { clearAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const links = [
    {
      name: "Home",
      path: "/",
      color: "var(--gradient-red)",
      glowColor: "#EF4444", // Solid color for LED glow
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

  const handleLogout = async () => {
    try {
      // Use regular fetch instead of fetchWithAuth to avoid refresh attempts
      await fetch("http://localhost:8000/api/auth/logout/", {
        method: "POST",
        credentials: "include", // Ensure cookies are included
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      // Always clear auth and redirect regardless of server response
      clearAuth();
      navigate("/Login");
    }
  };
  const { accessToken } = useContext(AuthContext);

  return (
    <div className="page">
      <Navbar links={links} onLogout={handleLogout} />
      <main className="dashboard-content">
        <h1>Dashboard Content</h1>
        <h2>{accessToken}</h2>
      </main>
    </div>
  );
};

export default Dashboard;
