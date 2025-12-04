import React, { useState } from 'react';
import '../Styles/Page/Admin/UserModal.css';

const AddCompanyModal = ({ isOpen, onClose, onCompanyAdded }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phoneNumber: '',
    role: 'waste manager',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ============ MOCK ADD COMPANY (CURRENTLY ACTIVE) ============
    console.log('Mock: Adding new company', formData);
    
    // Create mock company object
    const newCompany = {
      user_id: Date.now(), // Use timestamp as ID
      company_name: formData.companyName,
      email: formData.email,
      phone_number: formData.phoneNumber,
      role: formData.role,
      account_status: 'Active',
      created_at: new Date().toISOString(),
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Call parent function to add company to list
    onCompanyAdded(newCompany);
    
    // Reset form and close modal
    setFormData({
      companyName: '',
      email: '',
      phoneNumber: '',
      role: 'waste manager',
      password: ''
    });
    setLoading(false);
    onClose();
    alert('Company added successfully!');
    // =============================================================

    // ============ REAL API ADD (COMMENTED OUT - USE LATER) ============
    // try {
    //   const token = localStorage.getItem('access_token');
    //   
    //   const response = await fetch('http://localhost:8000/api/auth/admin/companies/create/', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       company_name: formData.companyName,
    //       email: formData.email,
    //       phone_number: formData.phoneNumber,
    //       role_name: formData.role,
    //       password: formData.password
    //     })
    //   });
    //   
    //   if (!response.ok) {
    //     throw new Error('Failed to add company');
    //   }
    //   
    //   const data = await response.json();
    //   onCompanyAdded(data); // Add new company to list
    //   
    //   // Reset form and close
    //   setFormData({
    //     companyName: '',
    //     email: '',
    //     phoneNumber: '',
    //     role: 'waste manager',
    //     password: ''
    //   });
    //   setLoading(false);
    //   onClose();
    //   alert('Company added successfully!');
    //   
    // } catch (err) {
    //   console.error('Error adding company:', err);
    //   setError('Failed to add company. Please try again.');
    //   setLoading(false);
    // }
    // ===================================================================
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Company</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="Enter company name"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter email address"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="waste manager">Waste Manager</option>
              <option value="recycling coordinator">Recycling Coordinator</option>
              <option value="disposal specialist">Disposal Specialist</option>
            </select>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              minLength="6"
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Company'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyModal;