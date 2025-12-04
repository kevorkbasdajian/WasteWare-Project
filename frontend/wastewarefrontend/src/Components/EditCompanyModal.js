import React, { useState, useEffect } from 'react';
import '../Styles/Page/Admin/UserModal.css';

const EditCompanyModal = ({ isOpen, onClose, company, onCompanyUpdated }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phoneNumber: '',
    role: 'waste manager',
    accountStatus: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.company_name || '',
        email: company.email || '',
        phoneNumber: company.phone_number || '',
        role: company.role || 'waste manager',
        accountStatus: company.account_status || 'Active'
      });
    }
  }, [company]);

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

    // ============ MOCK UPDATE COMPANY (CURRENTLY ACTIVE) ============
    console.log('Mock: Updating company', company.user_id, formData);
    
    // Create updated company object
    const updatedCompany = {
      ...company,
      company_name: formData.companyName,
      email: formData.email,
      phone_number: formData.phoneNumber,
      role: formData.role,
      account_status: formData.accountStatus
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Call parent function to update company in list
    onCompanyUpdated(updatedCompany);
    
    setLoading(false);
    onClose();
    alert('Company updated successfully!');
    // ================================================================

    // ============ REAL API UPDATE (COMMENTED OUT - USE LATER) ============
    // try {
    //   const token = localStorage.getItem('access_token');
    //   
    //   const response = await fetch(`http://localhost:8000/api/auth/admin/companies/${company.user_id}/`, {
    //     method: 'PUT',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       company_name: formData.companyName,
    //       email: formData.email,
    //       phone_number: formData.phoneNumber,
    //       role_name: formData.role,
    //       account_status: formData.accountStatus
    //     })
    //   });
    //   
    //   if (!response.ok) {
    //     throw new Error('Failed to update company');
    //   }
    //   
    //   const data = await response.json();
    //   onCompanyUpdated(data); // Update company in list
    //   
    //   setLoading(false);
    //   onClose();
    //   alert('Company updated successfully!');
    //   
    // } catch (err) {
    //   console.error('Error updating company:', err);
    //   setError('Failed to update company. Please try again.');
    //   setLoading(false);
    // }
    // ======================================================================
  };

  if (!isOpen || !company) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Company</h2>
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
            <label>Account Status *</label>
            <select
              name="accountStatus"
              value={formData.accountStatus}
              onChange={handleChange}
              required
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Banned">Banned</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Company'}
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

export default EditCompanyModal;