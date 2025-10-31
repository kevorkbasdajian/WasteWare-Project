import React, { useState, useEffect } from 'react';
import '../Styles/Page/clientReports.css';
import Navbar from '../Components/navbar.js';

const Reports = () => {
  const [autoGPS, setAutoGPS] = useState(true);
  const [coordinates, setCoordinates] = useState('33.8893, 35.5534');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [details, setDetails] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'dumping', name: 'Illegal Dumping', icon: '🗑️', subtext: 'Large Waste Dumps' },
    { id: 'littering', name: 'Public Littering', icon: '🚮', subtext: 'Street Waste' },
    { id: 'hazardous', name: 'Hazardous Materials', icon: '☢️', subtext: 'Chemicals, medical waste' },
    { id: 'construction', name: 'Construction Debris', icon: '🧱', subtext: 'Building Waste' },
    { id: 'organic', name: 'Organic Waste', icon: '🍃', subtext: 'Food Waste, Garden Waste' },
    { id: 'ewaste', name: 'E-Waste', icon: '📱', subtext: 'Electronics, batteries' },
  ];

  const severityLevels = ['Low', 'Medium', 'High', 'Critical'];
  
  const priorityLevels = [
    { id: 'routine', label: 'Routine', color: '#2E7D32' },
    { id: 'moderate', label: 'Moderate', color: '#FF9800' },
    { id: 'high', label: 'High', color: '#FF9800' },
    { id: 'emergency', label: 'Emergency', color: '#EF4444' },
  ];

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

  useEffect(() => {
    if (autoGPS && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => console.log('GPS error:', error)
      );
    }
  }, [autoGPS]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title || !selectedCategory || !severityLevel || !priorityLevel) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', selectedCategory);
      formData.append('severity', severityLevel);
      formData.append('priority', priorityLevel);
      formData.append('coordinates', coordinates);
      formData.append('address', address);
      formData.append('city', city);
      formData.append('governorate', governorate);
      formData.append('details', details);
      
      // Add photo if uploaded
      const photoInput = document.getElementById('photo-input');
      if (photoInput && photoInput.files[0]) {
        formData.append('photo', photoInput.files[0]);
      }
      
      // Get authentication token
      // const token = localStorage.getItem('access_token');
      
      // if (!token) {
      //   alert('Please login to submit a report');
      //   setIsSubmitting(false);
      //   return;
      // }
      
      // Send POST request to Django backend
      const response = await fetch('http://localhost:8000/report', {
        method: 'POST',
        // headers: {
        //   'Authorization': `Bearer `,
        // },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Report created:', data);
        alert('Report submitted successfully! 🎉');
        
        // Reset form
        setTitle('');
        setSelectedCategory('');
        setSeverityLevel('');
        setPriorityLevel('');
        setAddress('');
        setCity('');
        setGovernorate('');
        setDetails('');
        setPhotoPreview(null);
        
        // Reset file input
        if (photoInput) {
          photoInput.value = '';
        }
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        
        // Show user-friendly error messages
        let errorMessage = 'Error submitting report. ';
        if (error.detail) {
          errorMessage += error.detail;
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += 'Please try again.';
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <div className="page">
      <Navbar
        links={links}
        onLogout={handleLogout}
      />
      
      <div className="report-container">
        <h1 className="report-main-title">Report Environmental Issue</h1>
        
        <form onSubmit={handleSubmit} className="report-form">
          {/* Left Section */}
          <div className="report-left">
            {/* Photo Evidence */}
            <div className="photo-section">
              <div className="section-header">
                <i className="fa-solid fa-camera section-icon"></i>
                <h3>Photo Evidence</h3>
              </div>
              
              <div className="photo-upload-area">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="photo-preview" />
                ) : (
                  <label htmlFor="photo-input" className="photo-upload-label">
                    <i className="fa-solid fa-upload upload-icon"></i>
                    <span>Add Photo</span>
                  </label>
                )}
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="photo-input"
                />
              </div>
            </div>

            {/* GPS Section */}
            <div className="gps-section">
              <div className="gps-toggle">
                <label className="toggle-container">
                  <input
                    type="checkbox"
                    checked={autoGPS}
                    onChange={(e) => setAutoGPS(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">Auto GPS</span>
              </div>
              
              <div className="gps-input-container">
                <i className="fa-solid fa-location-dot gps-icon"></i>
                <input
                  type="text"
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  disabled={autoGPS}
                  className="gps-input"
                />
              </div>

              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="address-input"
              />

              <div className="location-selects">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="location-select"
                >
                  <option value="">City</option>
                  <option value="beirut">Beirut</option>
                  <option value="tripoli">Tripoli</option>
                  <option value="sidon">Sidon</option>
                </select>

                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="location-select"
                >
                  <option value="">Governorate</option>
                  <option value="beirut">Beirut</option>
                  <option value="north">North</option>
                  <option value="south">South</option>
                </select>
              </div>
            </div>

            {/* Emergency Button */}
            <button type="button" className="emergency-btn">
              Emergency?<br />📞 112
            </button>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>

          {/* Right Section */}
          <div className="report-right">
            {/* Title Input */}
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="title-input"
              required
            />

            {/* Category Selection */}
            <div className="category-section">
              <div className="section-header-green">
                <span className="section-number">1</span>
                <h3>What are you reporting?</h3>
              </div>
              
              <div className="category-grid">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{cat.name}</span>
                    <span className="category-subtext">{cat.subtext}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Level */}
            <div className="severity-section">
              <div className="section-header-green">
                <span className="section-number">2</span>
                <h3>Severity Level</h3>
              </div>
              
              <div className="severity-grid">
                {severityLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`severity-btn ${severityLevel === level ? 'active' : ''}`}
                    onClick={() => setSeverityLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Priority */}
            <div className="priority-section">
              <div className="section-header-green">
                <span className="section-number">3</span>
                <h3>Response Priority</h3>
              </div>
              
              <div className="priority-grid">
                {priorityLevels.map((priority) => (
                  <button
                    key={priority.id}
                    type="button"
                    className={`priority-btn ${priorityLevel === priority.id ? 'active' : ''}`}
                    onClick={() => setPriorityLevel(priority.id)}
                    style={{ '--priority-color': priority.color }}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Details Textarea */}
            <textarea
              placeholder="Details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="details-textarea"
              rows={4}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Reports;