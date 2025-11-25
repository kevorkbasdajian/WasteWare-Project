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
      path: "/Company",
      color: "var(--gradient-red)",
      glowColor: "#EF4444", // Solid color for LED glow
      icon: <i className="fa-solid fa-house fa-lg" />,
    },
    {
      name: "Routes",
      path: "/Company/Routes",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: <i className="fa-solid fa-map-location-dot fa-lg" />,
    },
    {
      name: "Schedule",
      path: "/Company/Schedule",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: <i className="fa-solid fa-camera fa-lg" />,
    },
    {
      name: "Notifications",
      path: "/Company/Notifications",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: <i className="fa-solid fa-gift fa-lg" />,
    },
    {
      name: "Reports",
      path: "/Company/Reports",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: <i className="fa-solid fa-user fa-lg" />,
    },
    {
      name: "Profile",
      path: "/Company/Profile",
      color: "var(--gradient-green-blue)",
      glowColor: "#9d10b9ff",
      icon: <i className="fa-solid fa-user fa-lg" />,
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
