import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Page/Profile/Profile.css';
import Navbar from '../../Components/navbar.js';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navbar links - same as in clientDashboard
  const links = [
    { 
      name: 'Home', 
      path: '/', 
      color: 'var(--gradient-red)',
      glowColor: '#EF4444',
      icon: <i className="fa-solid fa-house fa-lg" />
    },
    { 
      name: 'Map', 
      path: '/map', 
      color: 'var(--gradient-clean-blue)',
      glowColor: '#3B82F6',
      icon: <i className="fa-solid fa-map-location-dot fa-lg" />
    },
    { 
      name: 'Report', 
      path: '/report', 
      color: 'var(--gradient-purple)',
      glowColor: '#A855F7',
      icon: <i className="fa-solid fa-camera fa-lg" />
    },
    { 
      name: 'Rewards', 
      path: '/rewards', 
      color: 'var(--gradient-orange)',
      glowColor: '#F97316',
      icon: <i className="fa-solid fa-gift fa-lg" />
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      color: 'var(--gradient-green-blue)',
      glowColor: '#10B981',
      icon: <i className="fa-solid fa-user fa-lg" />
    },
  ];

  // ========================================
  // FETCH PROFILE DATA
  // ========================================
  // CURRENT: USING MOCK DATA (for development)
  // When login is ready:
  // 1. Comment out the MOCK DATA section
  // 2. Uncomment the REAL API FETCH section
  // ========================================

  useEffect(() => {
    // ============ MOCK DATA (CURRENTLY ACTIVE) ============
    const mockData = {
      name: "Kevork Basdajian",
      email: "kevork@gmail.com",
      avatar: "https://i.pravatar.cc/150?img=12",
      badge: "Eco Warrior",
      stats: {
        co2Reduced: 12.5,
        treesSaved: 47,
        wasteRecycled: 156,
        reportsSubmitted: 89,
        ecoPoints: 1247,
        daysActive: 127
      }
    };
    
    setProfileData(mockData);
    setLoading(false);
    // ======================================================


    // ============ REAL API FETCH (COMMENTED OUT - USE LATER) ============
    // Uncomment this when login is working and backend is ready
    // 
    // const fetchProfile = async () => {
    //   try {
    //     // Get JWT token from localStorage (saved during login)
    //     const token = localStorage.getItem('access_token');
    //     
    //     if (!token) {
    //       // No token found - redirect to login
    //       navigate('/login');
    //       return;
    //     }
    //     
    //     // Make API call to backend
    //     const response = await fetch('http://localhost:8000/api/auth/profile/', {
    //       method: 'GET',
    //       headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //       },
    //     });
    //     
    //     if (!response.ok) {
    //       if (response.status === 401) {
    //         // Token expired or invalid - redirect to login
    //         localStorage.removeItem('access_token');
    //         navigate('/login');
    //         return;
    //       }
    //       throw new Error('Failed to fetch profile');
    //     }
    //     
    //     const data = await response.json();
    //     
    //     // Transform backend data to match frontend format
    //     const transformedData = {
    //       name: data.name,
    //       email: data.email,
    //       avatar: data.avatar,
    //       badge: data.badge,
    //       stats: {
    //         co2Reduced: data.stats.co2_reduced,
    //         treesSaved: data.stats.trees_saved,
    //         wasteRecycled: data.stats.waste_recycled,
    //         reportsSubmitted: data.stats.reports_submitted,
    //         ecoPoints: data.stats.eco_points,
    //         daysActive: data.stats.days_active
    //       }
    //     };
    //     
    //     setProfileData(transformedData);
    //     setLoading(false);
    //     
    //   } catch (err) {
    //     console.error('Error fetching profile:', err);
    //     setError('Failed to load profile data');
    //     setLoading(false);
    //   }
    // };
    // 
    // fetchProfile();
    // =====================================================================

  }, [navigate]);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    
    // ============ REAL LOGOUT (COMMENTED OUT - USE LATER) ============
    // Uncomment when ready:
    // localStorage.removeItem('access_token');
    // localStorage.removeItem('refresh_token');
    // navigate('/login');
    // ==================================================================
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-page">
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <>
      <Navbar
        links={links}
        onLogout={handleLogout}
        profileImage={profileData.avatar}
      />
      <div className="profile-page">
        <div className="profile-container">
          
          {/* Top Section */}
          <div className="profile-top-section">
            
            {/* Left: Profile Card */}
            <div className="profile-card">
              <div className="profile-avatar-wrapper">
                <img 
                  src={profileData.avatar} 
                  alt="Profile" 
                  className="profile-avatar"
                />
                <span className="profile-badge">{profileData.badge}</span>
              </div>
              <h2 className="profile-name">{profileData.name}</h2>
              <p className="profile-email">{profileData.email}</p>
              <button 
                className="btn-edit-profile"
                onClick={handleEditProfile}
              >
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
                    <h3>{profileData.stats.co2Reduced}</h3>
                    <p>Tons CO2 Reduced</p>
                  </div>
                  <div className="impact-stat">
                    <h3>{profileData.stats.treesSaved}</h3>
                    <p>Trees Saved</p>
                  </div>
                  <div className="impact-stat">
                    <h3>{profileData.stats.wasteRecycled}</h3>
                    <p>kg Waste Recycled</p>
                  </div>
                </div>
              </div>

              {/* Three Small Stats Cards */}
              <div className="small-stats-grid">
                <div className="small-stat-card">
                  <i className="fa-solid fa-chart-simple stat-icon green"></i>
                  <h3>{profileData.stats.reportsSubmitted}</h3>
                  <p>Reports Filled</p>
                </div>
                <div className="small-stat-card">
                  <i className="fa-solid fa-leaf stat-icon orange"></i>
                  <h3>{profileData.stats.ecoPoints}</h3>
                  <p>EcoPoints</p>
                </div>
                <div className="small-stat-card">
                  <i className="fa-solid fa-calendar-days stat-icon blue"></i>
                  <h3>{profileData.stats.daysActive}</h3>
                  <p>Days Active</p>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Section: Settings Cards */}
          <div className="settings-grid">
            
            <div className="setting-card" onClick={() => navigate('/settings/personal')}>
              <i className="fa-solid fa-user setting-icon"></i>
              <div className="setting-content">
                <h3>Personal Information</h3>
                <p>Update your profile and contact details</p>
              </div>
            </div>

            <div className="setting-card" onClick={() => navigate('/settings/notifications')}>
              <i className="fa-solid fa-bell setting-icon"></i>
              <div className="setting-content">
                <h3>Notification Settings</h3>
                <p>Manage alerts and reminders</p>
              </div>
            </div>

            <div className="setting-card" onClick={() => navigate('/settings/language')}>
              <i className="fa-solid fa-globe setting-icon"></i>
              <div className="setting-content">
                <h3>Language & Region</h3>
                <p>English, French, Arabic, Armenian</p>
              </div>
            </div>

            <div className="setting-card" onClick={() => navigate('/settings/activity')}>
              <i className="fa-solid fa-file-lines setting-icon"></i>
              <div className="setting-content">
                <h3>Activity Timeline</h3>
                <p>View your submitted reports</p>
              </div>
            </div>

            <div className="setting-card" onClick={() => navigate('/settings/privacy')}>
              <i className="fa-solid fa-shield-halved setting-icon"></i>
              <div className="setting-content">
                <h3>Privacy & Security</h3>
                <p>Manage your data and privacy</p>
              </div>
            </div>

            <div className="setting-card" onClick={() => navigate('/help')}>
              <i className="fa-solid fa-circle-question setting-icon"></i>
              <div className="setting-content">
                <h3>Help & Support</h3>
                <p>Get help and contact support</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
};

export default ProfilePage;