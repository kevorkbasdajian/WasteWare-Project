import React, { useState, useEffect } from 'react';
import '../Styles/Page/Admin/UserModal.css';

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'user',
    accountStatus: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form when user changes
  useEffect(() => {
    if (user) {
      const nameParts = user.full_name.split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email,
        phoneNumber: user.phone_number || '',
        role: user.role,
        accountStatus: user.account_status
      });
    }
  }, [user]);

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

    // ============ MOCK UPDATE USER (CURRENTLY ACTIVE) ============
    console.log('Mock: Updating user', user.user_id, formData);
    
    // Create updated user object
    const updatedUser = {
      ...user,
      full_name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone_number: formData.phoneNumber,
      role: formData.role,
      account_status: formData.accountStatus
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Call parent function to update user in list
    onUserUpdated(updatedUser);
    
    setLoading(false);
    onClose();
    alert('User updated successfully!');
    // =============================================================

    // ============ REAL API UPDATE (COMMENTED OUT - USE LATER) ============
    // try {
    //   const token = localStorage.getItem('access_token');
    //   
    //   const response = await fetch(`http://localhost:8000/api/auth/admin/users/${user.user_id}/`, {
    //     method: 'PUT',
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
    //       account_status: formData.accountStatus
    //     })
    //   });
    //   
    //   if (!response.ok) {
    //     throw new Error('Failed to update user');
    //   }
    //   
    //   const data = await response.json();
    //   onUserUpdated(data); // Update user in list
    //   
    //   setLoading(false);
    //   onClose();
    //   alert('User updated successfully!');
    //   
    // } catch (err) {
    //   console.error('Error updating user:', err);
    //   setError('Failed to update user. Please try again.');
    //   setLoading(false);
    // }
    // ======================================================================
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit User</h2>
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
              {loading ? 'Updating...' : 'Update User'}
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

export default EditUserModal;