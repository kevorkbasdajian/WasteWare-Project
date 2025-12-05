import React, { useState, useEffect } from "react";
import "../Styles/Page/Admin/addUserModal.css";
import "../Styles/Page/Admin/UserModal.css";
import { useFetchWithAuth } from "./fetchWithAuth";

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const fetchWithAuth = useFetchWithAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill form when user changes
  useEffect(() => {
    if (user) {
      const nameParts = user.full_name.split(" ");
      setFormData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phoneNumber: user.phone_number || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/auth/admin/users/${user.user_id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const data = await response.json();
      onUserUpdated(data.user); // Update user in list

      setLoading(false);
      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user. Please try again.");
      setLoading(false);
    }
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

          <div className="form-groupw">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div
            className="modal-actions"
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
