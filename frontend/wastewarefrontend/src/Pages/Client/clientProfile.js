import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Page/clientProfile.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider.js";
import EditProfileModal from "../Profile/EditProfileModal.js";

const ProfilePage = () => {
  const {
    clearAuth,
    accessToken,
    userData,
    isLoadingUser,
    userError,
    user_type,
    refreshUserData,
  } = useContext(AuthContext);
  const navigate = useNavigate();

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
  ];

  // Check authentication on mount
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
  };

  const handleModalSuccess = () => {
    // Optional: Show success message or toast notification
    console.log("Profile updated successfully!");
  };
  useEffect(() => {
    if (user_type && user_type !== "user" && user_type !== "admin") {
      navigate(-1);
    }
  }, [user_type, navigate]);
  // Loading state
  if (isLoadingUser) {
    return (
      <div className="loading">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Error state
  if (userError) {
    return (
      <div className="error-page">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <p>{userError}</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  // No profile data
  if (!userData) {
    return (
      <div className="error-page">
        <p>No profile data found</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <>
      <Navbar
        links={links}
        profileImage={
          userData?.avatar
            ? `https://wasteware-project-production.up.railway.app${userData.avatar}`
            : "https://ui-avatars.com/api/?name=User&background=random"
        }
        profilePath="/client/profile"
      />
      <div className="profile-page" style={{ marginTop: "80px" }}>
        <div className="profile-container">
          {/* Top Section */}
          <div className="profile-top-section">
            {/* Left: Profile Card */}
            <div className="profile-card">
              <div className="profile-avatar-wrapper">
                <img
                  src={
                    userData.avatar === ""
                      ? "https://ui-avatars.com/api/?name=User&background=random"
                      : `https://wasteware-project-production.up.railway.app${userData.avatar}`
                  }
                  alt="Profile"
                  className="profile-avatar"
                />
                <span className="profile-badge">{userData.badge}</span>
              </div>
              <h2 className="profile-name">{userData.name}</h2>
              <p className="profile-email">{userData.email}</p>

              {/* Quick Stats in Profile Card */}
              <div className="profile-quick-stats">
                <div className="quick-stat">
                  <span className="quick-stat-value">
                    {userData.stats?.reportsSubmitted || 0}
                  </span>
                  <span className="quick-stat-label">Reports</span>
                </div>
                <div className="quick-stat-divider"></div>
                <div className="quick-stat">
                  <span className="quick-stat-value">
                    {userData.stats?.ecoPoints || 0}
                  </span>
                  <span className="quick-stat-label">Points</span>
                </div>
                <div className="quick-stat-divider"></div>
                <div className="quick-stat">
                  <span className="quick-stat-value">
                    {userData.stats?.daysActive || 0}
                  </span>
                  <span className="quick-stat-label">Days</span>
                </div>
              </div>

              <button className="btn-edit-profile" onClick={handleEditProfile}>
                <i className="fa-solid fa-pen"></i>
                Edit Profile
              </button>
            </div>

            {/* Right: Stats Cards */}
            <div className="stats-section">
              {/* Environmental Impact Card */}
              <div className="impact-card">
                <div className="impact-header">
                  <i className="fa-solid fa-earth-americas"></i>
                  <span>Your Environmental Impact</span>
                </div>
                <div className="impact-stats">
                  <div className="impact-stat">
                    <h3>{userData.stats?.co2Reduced || 0}</h3>
                    <p>Tons CO2 Reduced</p>
                  </div>
                  <div className="impact-stat">
                    <h3>{userData.stats?.treesSaved || 0}</h3>
                    <p>Trees Saved</p>
                  </div>
                  <div className="impact-stat">
                    <h3>{userData.stats?.wasteRecycled || 0}</h3>
                    <p>kg Waste Recycled</p>
                  </div>
                </div>
              </div>

              {/* Three Small Stats Cards */}
              <div className="small-stats-grid">
                <div className="small-stat-card">
                  <i className="fa-solid fa-chart-simple stat-icon green"></i>
                  <h3>{userData.stats?.reportsSubmitted || 0}</h3>
                  <p>Reports Filled</p>
                </div>
                <div className="small-stat-card">
                  <i className="fa-solid fa-leaf stat-icon orange"></i>
                  <h3>{userData.stats?.ecoPoints || 0}</h3>
                  <p>EcoPoints</p>
                </div>
                <div className="small-stat-card">
                  <i className="fa-solid fa-calendar-days stat-icon blue"></i>
                  <h3>{userData.stats?.daysActive || 0}</h3>
                  <p>Days Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Settings Cards */}
          <div className="settings-grid">
            <div
              className="setting-card"
              onClick={() => navigate("/settings/personal")}
            >
              <i className="fa-solid fa-user setting-icon"></i>
              <div className="setting-content">
                <h3>Personal Information</h3>
                <p>Update your profile and contact details</p>
              </div>
            </div>

            <div
              className="setting-card"
              onClick={() => navigate("/settings/notifications")}
            >
              <i className="fa-solid fa-bell setting-icon"></i>
              <div className="setting-content">
                <h3>Notification Settings</h3>
                <p>Manage alerts and reminders</p>
              </div>
            </div>

            <div
              className="setting-card"
              onClick={() => navigate("/settings/language")}
            >
              <i className="fa-solid fa-globe setting-icon"></i>
              <div className="setting-content">
                <h3>Language & Region</h3>
                <p>English, French, Arabic, Armenian</p>
              </div>
            </div>

            <div
              className="setting-card"
              onClick={() => navigate("/settings/activity")}
            >
              <i className="fa-solid fa-file-lines setting-icon"></i>
              <div className="setting-content">
                <h3>Activity Timeline</h3>
                <p>View your submitted reports</p>
              </div>
            </div>

            <div
              className="setting-card"
              onClick={() => navigate("/settings/privacy")}
            >
              <i className="fa-solid fa-shield-halved setting-icon"></i>
              <div className="setting-content">
                <h3>Privacy & Security</h3>
                <p>Manage your data and privacy</p>
              </div>
            </div>

            <div className="setting-card" onClick={() => navigate("/help")}>
              <i className="fa-solid fa-circle-question setting-icon"></i>
              <div className="setting-content">
                <h3>Help & Support</h3>
                <p>Get help and contact support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export default ProfilePage;
