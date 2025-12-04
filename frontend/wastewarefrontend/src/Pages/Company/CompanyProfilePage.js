import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Page/Company/CompanyProfile.css';
import CompanySidebar from '../../Components/CompanySidebar';

const CompanyProfilePage = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ========================================
  // FETCH COMPANY PROFILE DATA
  // ========================================
  useEffect(() => {
    // ============ MOCK DATA (CURRENTLY ACTIVE) ============
    const mockProfile = {
      company_name: 'Company Name',
      contact_person_name: 'Mahmoud Khreij',
      role_name: 'Waste Manager',
      email: 'company@gmail.com',
      phone_number: '+961 12345678',
      city: 'Beirut',
      area: 'Zukaiq st, Bldg',
      avatar: 'https://via.placeholder.com/150/10B981/FFFFFF?text=C',
    };

    setProfileData(mockProfile);
    setLoading(false);
    // ======================================================

    // ============ REAL API FETCH (COMMENTED OUT - USE LATER) ============
    // const fetchProfile = async () => {
    //   try {
    //     const token = localStorage.getItem('access_token');
    //     
    //     if (!token) {
    //       navigate('/login');
    //       return;
    //     }
    //     
    //     const response = await fetch('http://localhost:8000/api/auth/company/profile/', {
    //       method: 'GET',
    //       headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //       },
    //     });
    //     
    //     if (!response.ok) {
    //       if (response.status === 401) {
    //         localStorage.removeItem('access_token');
    //         navigate('/login');
    //         return;
    //       }
    //       throw new Error('Failed to fetch profile');
    //     }
    //     
    //     const data = await response.json();
    //     setProfileData(data);
    //     setLoading(false);
    //     
    //   } catch (err) {
    //     console.error('Error fetching profile:', err);
    //     setError('Failed to load profile');
    //     setLoading(false);
    //   }
    // };
    // 
    // fetchProfile();
    // =====================================================================
  }, [navigate]);

  const handleLogout = () => {
    console.log('Logout clicked');
    
    // ============ REAL LOGOUT (COMMENTED OUT - USE LATER) ============
    // localStorage.removeItem('access_token');
    // localStorage.removeItem('refresh_token');
    // navigate('/login');
    // ==================================================================
  };

  const handleEditProfile = () => {
    navigate('/company/edit-profile');
  };

  const handleSettingClick = (setting) => {
    console.log('Setting clicked:', setting);
    // TODO: Navigate to respective setting pages
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

  // Settings cards
  const settingsCards = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Update your profile and contact details',
      icon: 'fa-user'
    },
    {
      id: 'activity',
      title: 'Activity Timeline',
      description: 'View your submitted reports',
      icon: 'fa-file-lines'
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Manage alerts and reminders',
      icon: 'fa-bell'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Manage your data and privacy',
      icon: 'fa-shield-halved'
    },
    {
      id: 'language',
      title: 'Language & Region',
      description: 'English, French, Arabic, Armenian',
      icon: 'fa-globe'
    },
    {
      id: 'support',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'fa-circle-question'
    }
  ];

  return (
    <>
      <CompanySidebar />
      
      <div className="profile-page">
        {/* Red Header */}
        <div className="profile-header-red">
          <h1>Profile</h1>
        </div>

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
              <button 
                className="btn-edit-profile"
                onClick={handleEditProfile}
              >
                <i className="fa-solid fa-pen"></i>
                Edit Profile
              </button>
            </div>

            {/* Right: Contact Person Info Card */}
            <div className="profile-info-card">
              <h3 className="info-card-title">Contact Person Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{profileData.contact_person_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role:</span>
                  <span className="info-value">{profileData.role_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profileData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{profileData.phone_number}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Company:</span>
                  <span className="info-value">{profileData.company_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">City:</span>
                  <span className="info-value">{profileData.city}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Area:</span>
                  <span className="info-value">{profileData.area}</span>
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