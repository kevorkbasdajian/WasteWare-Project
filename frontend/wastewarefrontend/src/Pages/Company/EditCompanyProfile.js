import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Page/Profile/EditProfile.css';
import CompanySidebar from '../../Components/CompanySidebar';

const EditCompanyProfile = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('https://via.placeholder.com/150/10B981/FFFFFF?text=C');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactPersonName: '',
    email: '',
    phone: '',
    city: '',
    area: '',
    avatar: null
  });

  // ========================================
  // FETCH COMPANY PROFILE FOR EDITING
  // ========================================
  useEffect(() => {
    // ============ MOCK DATA (CURRENTLY ACTIVE) ============
    const mockData = {
      companyName: 'Company Name',
      contactPersonName: 'Mahmoud Khreij',
      email: 'company@gmail.com',
      phone: '+961 12345678',
      city: 'Beirut',
      area: 'Zukaiq st, Bldg',
      avatar: null
    };
    setFormData(mockData);
    setAvatarPreview('https://via.placeholder.com/150/10B981/FFFFFF?text=C');
    // ======================================================

    // ============ REAL API FETCH (COMMENTED OUT - USE LATER) ============
    // const fetchProfile = async () => {
    //   try {
    //     const token = localStorage.getItem('access_token');
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
    //     const transformedData = {
    //       companyName: data.company_name,
    //       contactPersonName: data.contact_person_name,
    //       email: data.email,
    //       phone: data.phone_number || '',
    //       city: data.city || '',
    //       area: data.area || '',
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
    // fetchProfile();
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
      setError('');
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
      alert('Company profile updated successfully!');
      navigate('/company/profile');
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
      // formDataToSend.append('company_name', formData.companyName);
      // formDataToSend.append('contact_person_name', formData.contactPersonName);
      // formDataToSend.append('email', formData.email);
      // formDataToSend.append('phone_number', formData.phone);
      // formDataToSend.append('city', formData.city);
      // formDataToSend.append('area', formData.area);
      // 
      // // Add avatar file if selected
      // if (formData.avatar) {
      //   formDataToSend.append('profile_image', formData.avatar);
      // }
      // 
      // const response = await fetch('http://localhost:8000/api/auth/company/profile/', {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
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
      // alert('Company profile updated successfully!');
      // navigate('/company/profile');
      // ======================================================================
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/company/profile');
  };

  return (
    <>
      <CompanySidebar />
      
      <div className="edit-profile-page">
        <div className="edit-profile-container">
          {/* LEFT SIDE */}
          <div className="edit-profile-sidebar">
            <div className="edit-profile-avatar-wrapper">
              <img 
                src={avatarPreview} 
                alt="Company Logo" 
                className="edit-profile-avatar"
              />
              <button 
                className="avatar-edit-icon" 
                type="button"
                onClick={handleAvatarClick}
                title="Change company logo"
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
            <h2 className="edit-profile-name">{formData.companyName}</h2>
            <p className="edit-profile-email">{formData.email}</p>
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="edit-profile-form-wrapper">
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="edit-profile-form">
              {/* Company Name */}
              <div className="form-field-row">
                <label className="form-label-col">Company Name</label>
                <div className="form-input-col">
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>

              {/* Contact Person Name */}
              <div className="form-field-row">
                <label className="form-label-col">Contact Person</label>
                <div className="form-input-col">
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
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
                    placeholder="Enter email"
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
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* City */}
              <div className="form-field-row">
                <label className="form-label-col">City</label>
                <div className="form-input-col">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                  />
                </div>
              </div>

              {/* Area */}
              <div className="form-field-row">
                <label className="form-label-col">Area</label>
                <div className="form-input-col">
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Enter area/address"
                  />
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
    </>
  );
};

export default EditCompanyProfile;
