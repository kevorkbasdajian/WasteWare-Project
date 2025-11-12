import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import '../Styles/Page/clientReports.css';
import Navbar from '../Components/navbar.js';

// Validation Schema
const reportValidationSchema = Yup.object().shape({
  title: Yup.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Title is required'),
  
  category: Yup.string()
    .oneOf(
      ['illegal dumping', 'public littering', 'hazardous materials', 'construction debris', 'organic waste', 'e-waste'],
      'Please select a valid category'
    )
    .required('Category is required'),
  
  severity: Yup.string()
    .oneOf(['low', 'medium', 'high', 'critical'], 'Please select a severity level')
    .required('Severity level is required'),
  
  priority: Yup.string()
    .oneOf(['routine', 'moderate', 'high', 'emergency'], 'Please select a priority level')
    .required('Priority level is required'),
  
  coordinates: Yup.string()
    .matches(
      /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/,
      'Coordinates must be in format: latitude, longitude'
    )
    .required('Coordinates are required'),
  
  address: Yup.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address is too long'),
  
  city: Yup.string()
    .required('City is required'),
  
  governorate: Yup.string()
    .required('Governorate is required'),
  
  details: Yup.string()
    .min(10, 'Details must be at least 10 characters')
    .max(2000, 'Details are too long'),
  
  // Photo is optional - no required validation
  photo: Yup.mixed()
    .nullable()
    .test('fileSize', 'File is too large (max 5MB)', (value) => {
      if (!value) return true; // Allow empty
      return value.size <= 5242880; // 5MB
    })
    .test('fileType', 'Unsupported file format', (value) => {
      if (!value) return true; // Allow empty
      return ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type);
    })
});

const Reports = () => {
  const [autoGPS, setAutoGPS] = useState(true);
  const [photoPreview, setPhotoPreview] = useState(null);

  const categories = [
    { id: 'illegal dumping', name: 'Illegal Dumping', icon: '🗑️', subtext: 'Large Waste Dumps' },
    { id: 'public littering', name: 'Public Littering', icon: '🚮', subtext: 'Street Waste' },
    { id: 'hazardous materials', name: 'Hazardous Materials', icon: '☢️', subtext: 'Chemicals, medical waste' },
    { id: 'construction debris', name: 'Construction Debris', icon: '🧱', subtext: 'Building Waste' },
    { id: 'organic waste', name: 'Organic Waste', icon: '🍃', subtext: 'Food Waste, Garden Waste' },
    { id: 'e-waste', name: 'E-Waste', icon: '📱', subtext: 'Electronics, batteries' },
  ];

  const severityLevels = [
    { id: 'low', color: '#2E7D32' },
    { id: 'medium', color: '#FF9800' },
    { id: 'high', color: '#FF9800' },
    { id: 'critical', color: '#EF4444' },
  ];
  
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

  // Initial form values
  const initialValues = {
    title: '',
    category: '',
    severity: '',
    priority: '',
    coordinates: '33.8893, 35.5534',
    address: '',
    city: '',
    governorate: '',
    details: '',
    photo: null
  };

  const handlePhotoUpload = (e, setFieldValue) => {
    const file = e.target.files[0];
    if (file) {
      setFieldValue('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (setFieldValue) => {
    setFieldValue('photo', null);
    setPhotoPreview(null);
    // Clear file input
    const photoInput = document.getElementById('photo-input');
    if (photoInput) {
      photoInput.value = '';
    }
  };

const handleSubmit = async (values, { setSubmitting, resetForm, setStatus }) => {
  try {
    const formData = new FormData();

    // Map severity string to integer expected by backend
    const severityMap = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };

    // Append required fields, ensuring strings
    formData.append('title', String(values.title || ''));
    formData.append('type_of_report', String(values.category || ''));
    formData.append('severity_level', String(severityMap[values.severity] || 1));
    formData.append('response_priority', String(values.priority || ''));
    formData.append('coordinates', String(values.coordinates || ''));
    formData.append('street_address', String(values.address || ''));
    formData.append('city_name', String(values.city || ''));
    formData.append('governorate', String(values.governorate || ''));
    formData.append('description', String(values.details || ''));

    // Append photo only if it exists
    if (values.photo) {
      formData.append('photo', values.photo);
    }

    // Optional: authentication token
    const token = localStorage.getItem('access_token');
    const headers = token
      ? { 'Authorization': `Bearer ${token}` }
      : {};

    // Send POST request
    const response = await fetch('http://localhost:8000/api/report/reports/', {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Report created:', data);
      alert('Report submitted successfully! 🎉');
      setStatus({ success: true, message: 'Report submitted successfully!' });
      resetForm();
    } else {
      const errorData = await response.json();
      console.error('❌ Error:', errorData);

      // Show field-specific errors
      let errorMessage = '';
      if (typeof errorData === 'object') {
        errorMessage = Object.entries(errorData)
          .map(([key, val]) => `${key}: ${val}`)
          .join('\n');
      } else {
        errorMessage = 'Failed to submit report.';
      }

      setStatus({ success: false, message: errorMessage });
      alert(errorMessage);
    }
  } catch (err) {
    console.error('🚨 Error submitting report:', err);
    setStatus({ success: false, message: 'Error submitting report.' });
    alert('Error submitting report.');
  } finally {
    setSubmitting(false);
  }

  console.log('Submitting values:', values);
};





  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div className="page">
      <Navbar
        links={links}
        onLogout={handleLogout}
      />
      
      <div className="report-container">
        <h1 className="report-main-title">Report Environmental Issue</h1>
        
        <Formik
          initialValues={initialValues}
          validationSchema={reportValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isSubmitting, setFieldValue, status }) => (
            <Form className="report-form">
              {/* Left Section */}
              <div className="report-left">
                {/* Photo Evidence */}
                <div className="photo-section">
                  <div className="section-header">
                    <i className="fa-solid fa-camera section-icon"></i>
                    <h3>Photo Evidence</h3>
                    <span className="optional-badge">(Optional)</span>
                  </div>
                  
                  <div className="photo-upload-area">
                    {photoPreview ? (
                      <div className="photo-preview-container">
                        <img src={photoPreview} alt="Preview" className="photo-preview" />
                        <div className="photo-actions">
                          <label htmlFor="photo-input" className="change-photo-btn">
                            <i className="fa-solid fa-rotate"></i>
                            Change Photo
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(setFieldValue)}
                            className="remove-photo-btn"
                          >
                            <i className="fa-solid fa-trash"></i>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="photo-input" className="photo-upload-label">
                        <i className="fa-solid fa-upload upload-icon"></i>
                        <span>Add Photo</span>
                        <span className="photo-hint">(Optional)</span>
                      </label>
                    )}
                    <input
                      id="photo-input"
                      name="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, setFieldValue)}
                      className="photo-input"
                    />
                  </div>
                  <ErrorMessage name="photo" component="div" className="error-message" />
                </div>

                {/* GPS Section */}
                <div className="gps-section">
                  <div className="gps-toggle">
                    <label className="toggle-container">
                      <input
                        type="checkbox"
                        checked={autoGPS}
                        onChange={(e) => {
                          setAutoGPS(e.target.checked);
                          if (e.target.checked && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const coords = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                                setFieldValue('coordinates', coords);
                              },
                              (error) => console.log('GPS error:', error)
                            );
                          }
                        }}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">Auto GPS</span>
                  </div>
                  
                  <div className="gps-input-container">
                    <i className="fa-solid fa-location-dot gps-icon"></i>
                    <Field
                      name="coordinates"
                      type="text"
                      disabled={autoGPS}
                      className="gps-input"
                    />
                  </div>
                  <ErrorMessage name="coordinates" component="div" className="error-message" />

                  <Field
                    name="address"
                    type="text"
                    placeholder="Address"
                    className="address-input"
                  />
                  <ErrorMessage name="address" component="div" className="error-message" />

                  <div className="location-selects">
                    <div>
                      <Field
                        as="select"
                        name="city"
                        className="location-select"
                      >
                        <option value="">City</option>
                        <option value="Beirut">Beirut</option>
                        <option value="Tripoli">Tripoli</option>
                        <option value="Sidon">Sidon</option>
                      </Field>
                      <ErrorMessage name="city" component="div" className="error-message" />
                    </div>

                    <div>
                      <Field
                        as="select"
                        name="governorate"
                        className="location-select"
                      >
                        <option value="">Governorate</option>
                        <option value="Beirut">Beirut</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                      </Field>
                      <ErrorMessage name="governorate" component="div" className="error-message" />
                    </div>
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

                {/* Status Message */}
                {status && (
                  <div className={`status-message ${status.success ? 'success' : 'error'}`}>
                    {status.message}
                  </div>
                )}
              </div>

              {/* Right Section */}
              <div className="report-right">
                {/* Title Input */}
                <Field
                  name="title"
                  type="text"
                  placeholder="Title"
                  className="title-input"
                />
                <ErrorMessage name="title" component="div" className="error-message" />

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
                        className={`category-btn ${values.category === cat.id ? 'active' : ''}`}
                        onClick={() => setFieldValue('category', cat.id)}
                      >
                        <span className="category-icon">{cat.icon}</span>
                        <span className="category-name">{cat.name}</span>
                        <span className="category-subtext">{cat.subtext}</span>
                      </button>
                    ))}
                  </div>
                  <ErrorMessage name="category" component="div" className="error-message" />
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
                        key={level.id}
                        type="button"
                        className={`severity-btn ${values.severity === level.id ? 'active' : ''}`}
                        onClick={() => setFieldValue('severity', level.id)}
                        style={{ '--severity-color': level.color }}
                      >
                        {level.id.charAt(0).toUpperCase() + level.id.slice(1)}
                      </button>
                    ))}
                  </div>
                  <ErrorMessage name="severity" component="div" className="error-message" />
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
                        className={`priority-btn ${values.priority === priority.id ? 'active' : ''}`}
                        onClick={() => setFieldValue('priority', priority.id)}
                        style={{ '--priority-color': priority.color }}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                  <ErrorMessage name="priority" component="div" className="error-message" />
                </div>

                {/* Details Textarea */}
                <Field
                  as="textarea"
                  name="details"
                  placeholder="Details"
                  className="details-textarea"
                  rows={4}
                />
                <ErrorMessage name="details" component="div" className="error-message" />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Reports; 