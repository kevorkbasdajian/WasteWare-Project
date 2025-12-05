import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Page/Company/CompanyProfile.css";
import CompanySidebar from "../../Components/CompanySidebar";
import { AuthContext } from "../../Components/AuthProvider";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
import Navbar from "../../Components/navbar.js";
import HeaderBox from "../../Components/HeaderBox.js";

const CompanyProfilePage = () => {
  const { clearAuth, accessToken, user_type } = useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();

  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate]);
  // useEffect(() => {
  //   if (user_type && user_type !== "company" && user_type !== "admin") {
  //     navigate(-1);
  //   }
  // }, [navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetchWithAuth(
          "http://localhost:8000/api/auth/company/profile/",
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        console.log(data);
        setProfileData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleEditProfile = () => {
    navigate("/company/edit-profile");
  };

  const handleSettingClick = (setting) => {
    console.log("Setting clicked:", setting);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-page">
        <p>{error}</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
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
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: "fa-solid fa-map-location-dot fa-lg",
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-calendar fa-lg",
    },
    {
      name: "Pickups",
      path: "/company/pickups",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: "fa-solid fa-gift fa-lg",
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
    <>
      {/* <CompanySidebar /> */}
      <Navbar
        links={links}
        onLogout={handleLogout}
        profilePath="/company/profile"
      />

      <div className="profile-page">
        {/* Red Header */}
        <HeaderBox
          text="Profile"
          gradientColors={["#E63946 30%", "#FF7F50 100%"]}
        />

        <div className="profile-container">
          {/* Top Section */}
          <div className="profile-top-section">
            {/* Left: Profile Card */}
            <div className="profile-card">
              <div className="profile-avatar-wrapper">
                <img
                  src={profileData.avatar}
                  alt="Company Logo"
                  className="profile-avatar"
                />
              </div>
              <h2 className="profile-name">{profileData.company_name}</h2>
              <button className="btn-edit-profile" onClick={handleEditProfile}>
                <i className="fa-solid fa-pen"></i>
                Edit Profile
              </button>
            </div>

            {/* Right: Contact Person Info Card */}
            <div className="profile-info-card">
              <h3 className="info-card-title">Contact Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profileData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{profileData.phone_number}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">City:</span>
                  <span className="info-value">{profileData.address.city}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Region:</span>
                  <span className="info-value">
                    {profileData.address.region}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Settings Cards */}
          <div className="settings-section">
            <div className="settings-grid">
              {settingsCards.map((card) => (
                <div
                  key={card.id}
                  className="setting-card"
                  onClick={() => handleSettingClick(card.id)}
                >
                  <div className="setting-icon-wrapper">
                    <i className={`fa-solid ${card.icon}`}></i>
                  </div>
                  <div className="setting-content">
                    <h4 className="setting-title">{card.title}</h4>
                    <p className="setting-description">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyProfilePage;
