import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Page/Profile/EditProfile.css';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('https://via.placeholder.com/150');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    avatar: null  // For storing the file
  });

  const bioCharCount = formData.bio.length;
  const bioMaxChars = 100;

  // ========================================
  // FETCH PROFILE DATA FOR EDITING
  // ========================================
  useEffect(() => {
    // ============ MOCK DATA (CURRENTLY ACTIVE) ============
    const mockData = {
      fullName: 'Kevork Basdajian',
      email: 'kevork@gmail.com',
      phone: '76627028',
      address: 'Lebanon,Beirut',
      bio: 'Computer Science Student At Haigazian.',
      avatar: null
    };
    setFormData(mockData);
    setAvatarPreview('https://i.pravatar.cc/150?img=12');
    // ======================================================

    // ============ REAL API FETCH (COMMENTED OUT - USE LATER) ============
    // const fetchProfileForEdit = async () => {
    //   try {
    //     const token = localStorage.getItem('access_token');
    //     if (!token) {
    //       navigate('/login');
    //       return;
    //     }
    //     
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
    //         localStorage.removeItem('access_token');
    //         navigate('/login');
    //         return;
    //       }
    //       throw new Error('Failed to fetch profile');
    //     }
    //     
    //     const data = await response.json();
    //     const transformedData = {
    //       fullName: data.name,
    //       email: data.email,
    //       phone: data.phone_number || '',
    //       address: data.address || '',
    //       bio: data.bio || '',
    //       avatar: null
    //     };
    //     
    //     setFormData(transformedData);
    //     setAvatarPreview(data.avatar);
    //     
    //   } catch (err) {
    //     console.error('Error fetching profile:', err);
    //     setError('Failed to load profile data');
    //   }
    // };
    // fetchProfileForEdit();
    // =====================================================================
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar click - trigger file input
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Store file in formData
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));

      setError(''); // Clear any previous errors
    }
  };

  // ========================================
  // SUBMIT PROFILE CHANGES
  // ========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ============ MOCK SUBMIT (CURRENTLY ACTIVE) ============
      console.log('Form submitted:', formData);
      console.log('Avatar file:', formData.avatar);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Profile updated successfully!');
      navigate('/profile');
      // =========================================================

      // ============ REAL API SUBMIT (COMMENTED OUT - USE LATER) ============
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   navigate('/login');
      //   return;
      // }
      // 
      // // Create FormData for file upload
      // const formDataToSend = new FormData();
      // 
      // // Split fullName
      // const nameParts = formData.fullName.trim().split(' ');
      // const firstName = nameParts[0];
      // const lastName = nameParts.slice(1).join(' ') || '';
      // 
      // formDataToSend.append('first_name', firstName);
      // formDataToSend.append('last_name', lastName);
      // formDataToSend.append('email', formData.email);
      // formDataToSend.append('phone_number', formData.phone);
      // formDataToSend.append('address', formData.address);
      // formDataToSend.append('bio', formData.bio);
      // 
      // // Add avatar file if selected
      // if (formData.avatar) {
      //   formDataToSend.append('profile_image', formData.avatar);
      // }
      // 
      // const response = await fetch('http://localhost:8000/api/auth/profile/', {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     // Don't set Content-Type - browser will set it with boundary for FormData
      //   },
      //   body: formDataToSend,
      // });
      // 
      // if (!response.ok) {
      //   if (response.status === 401) {
      //     localStorage.removeItem('access_token');
      //     navigate('/login');
      //     return;
      //   }
      //   throw new Error('Failed to update profile');
      // }
      // 
      // const result = await response.json();
      // console.log('Profile updated:', result);
      // alert('Profile updated successfully!');
      // navigate('/profile');
      // ======================================================================

    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        {/* LEFT SIDE */}
        <div className="edit-profile-sidebar">
          <div className="edit-profile-avatar-wrapper">
            <img 
              src={avatarPreview} 
              alt="Profile" 
              className="edit-profile-avatar"
            />
            <button 
              className="avatar-edit-icon" 
              type="button"
              onClick={handleAvatarClick}
              title="Change profile photo"
            >
              📷
            </button>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <h2 className="edit-profile-name">{formData.fullName}</h2>
          <p className="edit-profile-email">{formData.email}</p>

          <div className="edit-profile-bio">
            <p>{formData.bio}</p>
            <span className="bio-char-count">{bioCharCount}/{bioMaxChars}</span>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="edit-profile-form-wrapper">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="edit-profile-form">
            {/* Full Name */}
            <div className="form-field-row">
              <label className="form-label-col">Full Name</label>
              <div className="form-input-col">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-field-row">
              <label className="form-label-col">Email</label>
              <div className="form-input-col">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-field-row">
              <label className="form-label-col">Phone Number</label>
              <div className="form-input-col">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-field-row">
              <label className="form-label-col">Address</label>
              <div className="form-input-col">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                />
              </div>
            </div>

            {/* About Me */}
            <div className="form-field-row about-me-row">
              <label className="form-label-col">About Me</label>
              <div className="form-input-col">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  maxLength={bioMaxChars}
                  placeholder="Tell us about yourself"
                  rows={2}
                />
                <span className="char-count-inline">
                  {bioCharCount}/{bioMaxChars}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Submit'}
              </button>
              <button 
                type="button" 
                className="btn-cancel-gray"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;