import { useContext, useEffect } from "react";
import "../../Styles/Page/clientDashboard.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";

const CompanyDashboard = () => {
  //   const fetchWithAuth = useFetchWithAuth();
  const { clearAuth } = useContext(AuthContext);
  const { accessToken } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate]);
  const links = [
    {
      name: "Home",
      path: "/company",
      color: "var(--gradient-red)",
      glowColor: "#EF4444", // Solid color for LED glow
      icon: <i className="fa-solid fa-house fa-lg" />,
    },
    {
      name: "Routes",
      path: "/company/routes",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: <i className="fa-solid fa-map-location-dot fa-lg" />,
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: <i className="fa-solid fa-camera fa-lg" />,
    },
    {
      name: "Pickups",
      path: "/company/pickups",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: <i className="fa-solid fa-gift fa-lg" />,
    },
    {
      name: "Reports",
      path: "/company/reports",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: <i className="fa-solid fa-user fa-lg" />,
    },
    {
      name: "Profile",
      path: "/company/profile",
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

  return (
    <div className="page">
      <Navbar links={links} onLogout={handleLogout} />
      <HeaderBox
        text="Company Dashboard"
        gradientColors={["#F97316 30%", "#EF4444 100%"]}
      />
      <main className="dashboard-content">
        <h1>Dashboard Content</h1>
      </main>
    </div>
  );
};

export default CompanyDashboard;
