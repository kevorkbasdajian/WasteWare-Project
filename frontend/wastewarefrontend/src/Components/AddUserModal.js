import React, { useState } from 'react';
import '../Styles/Page/Admin/UserModal.css';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'user',
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

    // ============ MOCK ADD USER (CURRENTLY ACTIVE) ============
    console.log('Mock: Adding new user', formData);
    
    // Create mock user object
    const newUser = {
      user_id: Date.now(), // Use timestamp as ID
      full_name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone_number: formData.phoneNumber,
      role: formData.role,
      account_status: 'Active',
      created_at: new Date().toISOString(),
      points_balance: 0
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Call parent function to add user to list
    onUserAdded(newUser);
    
    // Reset form and close modal
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'user',
      password: ''
    });
    setLoading(false);
    onClose();
    alert('User added successfully!');
    // ==========================================================

    // ============ REAL API ADD (COMMENTED OUT - USE LATER) ============
    // try {
    //   const token = localStorage.getItem('access_token');
    //   
    //   const response = await fetch('http://localhost:8000/api/auth/admin/users/create/', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       first_name: formData.firstName,
    //       last_name: formData.lastName,
    //       email: formData.email,
    //       phone_number: formData.phoneNumber,
    //       role_name: formData.role,
    //       password: formData.password
    //     })
    //   });
    //   
    //   if (!response.ok) {
    //     throw new Error('Failed to add user');
    //   }
    //   
    //   const data = await response.json();
    //   onUserAdded(data); // Add new user to list
    //   
    //   // Reset form and close
    //   setFormData({
    //     firstName: '',
    //     lastName: '',
    //     email: '',
    //     phoneNumber: '',
    //     role: 'user',
    //     password: ''
    //   });
    //   setLoading(false);
    //   onClose();
    //   alert('User added successfully!');
    //   
    // } catch (err) {
    //   console.error('Error adding user:', err);
    //   setError('Failed to add user. Please try again.');
    //   setLoading(false);
    // }
    // ===================================================================
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New User</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Enter last name"
              />
            </div>
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
              <option value="user">User</option>
              <option value="admin">Admin</option>
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
              {loading ? 'Adding...' : 'Add User'}
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

export default AddUserModal;