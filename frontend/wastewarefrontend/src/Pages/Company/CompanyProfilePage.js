import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Page/Company/CompanyProfile.css";
import { AuthContext } from "../../Components/AuthProvider";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
import Navbar from "../../Components/navbar.js";
import HeaderBox from "../../Components/HeaderBox.js";
import EditCompanyProfileModal from "./EditCompanyProfile.js";

const CompanyProfilePage = () => {
  const { clearAuth, accessToken, user_type, refreshUserData } =
    useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();

  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    totalDrivers: 0,
    totalTrucks: 0,
    availableTrucks: 0,
    totalDumpings: 0,
    todayPickups: 0,
    completedPickups: 0,
    totalPickups: 0,
    daysActive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate, accessToken]);

  // Fetch profile data and stats
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      // Fetch profile and all stats data in parallel
      const [profileResponse, routes, drivers, trucks, dumpings, pickups] =
        await Promise.all([
          fetchWithAuth(
            "https://wasteware-project-production.up.railway.app/api/auth/company/profile/",
            { method: "GET" }
          ),
          fetch(
            "https://wasteware-project-production.up.railway.app/api/company/routes/",
            { headers }
          ).then((r) => r.json()),
          fetch(
            "https://wasteware-project-production.up.railway.app/api/company/drivers/",
            { headers }
          ).then((r) => r.json()),
          fetch(
            "https://wasteware-project-production.up.railway.app/api/company/trucks/",
            { headers }
          ).then((r) => r.json()),
          fetch(
            "https://wasteware-project-production.up.railway.app/api/company/dumpings/",
            { headers }
          ).then((r) => r.json()),
          fetch(
            "https://wasteware-project-production.up.railway.app/api/company/pickups/",
            { headers }
          ).then((r) => r.json()),
        ]);

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await profileResponse.json();
      console.log("Profile data:", data);

      // Calculate stats
      const activeRoutes = (routes || []).filter((r) => r.status === "active");
      const availableTrucks = (trucks || []).filter((t) => t.available);
      const completedPickups = (pickups || []).filter(
        (p) => p.status === "completed"
      );
      const todayPickups = (pickups || []).filter((p) => {
        const pickupDate = new Date(p.schedule?.pickup_date || p.pickup_date);
        const today = new Date();
        return pickupDate.toDateString() === today.toDateString();
      });

      // Calculate days active (days since company creation)
      const createdDate = new Date(data.created_at);
      const today = new Date();
      const daysActive = Math.floor(
        (today - createdDate) / (1000 * 60 * 60 * 24)
      );

      setStats({
        totalRoutes: (routes || []).length,
        activeRoutes: activeRoutes.length,
        totalDrivers: (drivers || []).length,
        totalTrucks: (trucks || []).length,
        availableTrucks: availableTrucks.length,
        totalDumpings: (dumpings || []).length,
        todayPickups: todayPickups.length,
        completedPickups: completedPickups.length,
        totalPickups: (pickups || []).length,
        daysActive: daysActive,
      });

      setProfileData(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken]);

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    // Refresh profile data after modal closes
    fetchProfile();
  };

  const handleModalSuccess = () => {
    console.log("Profile updated successfully!");
    // Refresh user data in context
    if (refreshUserData) {
      refreshUserData();
    }
  };

  const handleSettingClick = (setting) => {
    console.log("Setting clicked:", setting);
    // Add navigation logic for different settings
  };

  if (loading) {
    return (
      <div className="loading">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <p>{error}</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="error-page">
        <p>No profile data found</p>
        <button onClick={() => navigate("/company")}>Go to Dashboard</button>
      </div>
    );
  }

  const links = [
    {
      name: "Home",
      path: "/company",
      color: "var(--gradient-red)",
      glowColor: "#EF4444",
      icon: "fa-solid fa-house fa-lg",
    },
    {
      name: "Routes",
      path: "/company/routes",
      color: "var(--gradient-light-green)",
      glowColor: "var(--light-green)",
      icon: "fa-solid fa-map-location-dot fa-lg",
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: "fa-solid fa-calendar-days fa-lg",
    },
    {
      name: "Pickups",
      path: "/company/pickups",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: "fa-solid fa-truck-pickup fa-lg",
    },
    {
      name: "Reports",
      path: "/company/reports",
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

  // Settings cards
  const settingsCards = [
    {
      id: "personal-info",
      title: "Personal Information",
      description: "Update your profile and contact details",
      icon: "fa-user",
    },
    {
      id: "activity",
      title: "Activity Timeline",
      description: "View your submitted reports",
      icon: "fa-file-lines",
    },
    {
      id: "notifications",
      title: "Notification Settings",
      description: "Manage alerts and reminders",
      icon: "fa-bell",
    },
    {
      id: "privacy",
      title: "Privacy & Security",
      description: "Manage your data and privacy",
      icon: "fa-shield-halved",
    },
    {
      id: "language",
      title: "Language & Region",
      description: "English, French, Arabic, Armenian",
      icon: "fa-globe",
    },
    {
      id: "support",
      title: "Help & Support",
      description: "Get help and contact support",
      icon: "fa-circle-question",
    },
  ];

  return (
    <>
      <Navbar
        links={links}
        profileImage={
          profileData?.avatar
            ? `https://wasteware-project-production.up.railway.app${profileData.avatar}`
            : "https://ui-avatars.com/api/?name=Company&background=10B981&color=fff&size=150"
        }
        profilePath="/company/profile"
        homepath="/company"
      />

      <div className="profile-page">
        <div className="profile-container">
          {/* Top Section */}
          <div className="profile-top-section">
            {/* Left: Profile Card */}
            <div className="profile-card">
              <div className="profile-avatar-wrapper">
                <img
                  src={
                    profileData.avatar
                      ? `https://wasteware-project-production.up.railway.app${profileData.avatar}`
                      : "https://ui-avatars.com/api/?name=Company&background=10B981&color=fff&size=150"
                  }
                  alt="Company Logo"
                  className="profile-avatar"
                />
              </div>
              <h2 className="profile-name">{profileData.company_name}</h2>
              <p className="profile-email">{profileData.email}</p>

              {/* Quick Stats in Profile Card */}
              <div className="profile-quick-stats">
                <div className="quick-stat">
                  <span className="quick-stat-value">{stats.activeRoutes}</span>
                  <span className="quick-stat-label">Routes</span>
                </div>
                <div className="quick-stat-divider"></div>
                <div className="quick-stat">
                  <span className="quick-stat-value">
                    {stats.completedPickups}
                  </span>
                  <span className="quick-stat-label">Pickups</span>
                </div>
                <div className="quick-stat-divider"></div>
                <div className="quick-stat">
                  <span className="quick-stat-value">{stats.daysActive}</span>
                  <span className="quick-stat-label">Days</span>
                </div>
              </div>

              <button className="btn-edit-profile" onClick={handleEditProfile}>
                <i className="fa-solid fa-pen"></i>
                Edit Profile
              </button>
            </div>

            {/* Right: Stats Section */}
            <div className="stats-section">
              {/* Company Information Card */}
              <div className="impact-card">
                <div className="impact-header">
                  <i className="fa-solid fa-building"></i>
                  <span>Company Information</span>
                </div>
                <div className="company-info-grid">
                  <div className="company-info-item">
                    <span className="company-info-label">
                      <i className="fa-solid fa-envelope"></i>
                      Email
                    </span>
                    <span className="company-info-value">
                      {profileData.email}
                    </span>
                  </div>
                  <div className="company-info-item">
                    <span className="company-info-label">
                      <i className="fa-solid fa-phone"></i>
                      Phone
                    </span>
                    <span className="company-info-value">
                      {profileData.phone_number || "Not provided"}
                    </span>
                  </div>
                  <div className="company-info-item">
                    <span className="company-info-label">
                      <i className="fa-solid fa-location-dot"></i>
                      City
                    </span>
                    <span className="company-info-value">
                      {profileData.address?.city || "Not provided"}
                    </span>
                  </div>
                  <div className="company-info-item">
                    <span className="company-info-label">
                      <i className="fa-solid fa-map"></i>
                      Region
                    </span>
                    <span className="company-info-value">
                      {profileData.address?.region || "Not provided"}
                    </span>
                  </div>
                  <div className="company-info-item">
                    <span className="company-info-label">
                      <i className="fa-solid fa-map-pin"></i>
                      Street
                    </span>
                    <span className="company-info-value">
                      {profileData.address?.street || "Not provided"}
                    </span>
                  </div>
                  <div className="company-info-item">
                    <span className="company-info-label">
                      <i className="fa-solid fa-hashtag"></i>
                      Postal Code
                    </span>
                    <span className="company-info-value">
                      {profileData.address?.postal_code || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Three Small Stats Cards */}
              <div className="small-stats-grid">
                <div className="small-stat-card">
                  <i className="fa-solid fa-route stat-icon green"></i>
                  <h3>{stats.activeRoutes}</h3>
                  <p>Active Routes</p>
                </div>
                <div className="small-stat-card">
                  <i className="fa-solid fa-truck stat-icon orange"></i>
                  <h3>{stats.completedPickups}</h3>
                  <p>Pickups Done</p>
                </div>
                <div className="small-stat-card">
                  <i className="fa-solid fa-calendar-days stat-icon blue"></i>
                  <h3>{stats.daysActive}</h3>
                  <p>Days Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Settings Cards */}
          <div className="settings-grid">
            {settingsCards.map((card) => (
              <div
                key={card.id}
                className="setting-card"
                onClick={() => handleSettingClick(card.id)}
              >
                <i className={`fa-solid ${card.icon} setting-icon`}></i>
                <div className="setting-content">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditCompanyProfileModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export default CompanyProfilePage;
