import { useContext } from "react";
import "../../Styles/Page/clientDashboard.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";

const CompanyDashboard = () => {
  //   const fetchWithAuth = useFetchWithAuth();
  const { clearAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const links = [
    {
      name: "Home",
      path: "/company",
      color: "var(--gradient-red)",
      glowColor: "#EF4444", // Solid color for LED glow
      icon: "fa-solid fa-house fa-lg",
    },
    {
      name: "Routes",
      path: "/company/routes",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: "fa-solid fa-map-location-dot fa-lg",
    },
    {
      name: "Reports",
      path: "/company/reports",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-camera fa-lg",
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: "fa-solid fa-clock fa-lg",
    },
    {
      name: "Notifications",
      path: "/company/notifications",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: "fa-solid fa-bell fa-lg",
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
  const { accessToken } = useContext(AuthContext);

  return (
    <div className="page">
      <Navbar links={links} onLogout={handleLogout} />
      <main className="dashboard-content">
        <h1>Dashboard Content</h1>
      </main>
    </div>
  );
};

export default CompanyDashboard;
