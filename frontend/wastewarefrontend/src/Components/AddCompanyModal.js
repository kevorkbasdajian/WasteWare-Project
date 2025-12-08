import React, { useState } from "react";
import "../Styles/Page/Admin/companyaddmodal.css";
import { useFetchWithAuth } from "./fetchWithAuth";

const AddCompanyModal = ({ isOpen, onClose, onCompanyAdded }) => {
  const fetchWithAuth = useFetchWithAuth();

  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetchWithAuth(
        "https://wasteware-project-production.up.railway.app/api/auth/admin/companies/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.error) {
          // Check if it's a nested error object
          if (typeof data.error === "object") {
            const firstError = Object.values(data.error)[0];
            setError(Array.isArray(firstError) ? firstError[0] : firstError);
          } else {
            setError(data.error);
          }
        } else {
          setError(data.detail || "Failed to add company");
        }
        setLoading(false);
        return;
      }

      // Success! Add company to list
      onCompanyAdded(data.company);

      // Reset form
      setFormData({
        company_name: "",
        email: "",
        phone_number: "",
        password: "",
      });

      setLoading(false);

      // Show success message

      // Close modal
      onClose();
    } catch (err) {
      console.error("Error adding company:", err);
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      company_name: "",
      email: "",
      phone_number: "",
      password: "",
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Company</h2>
          <button className="modal-close" onClick={handleClose} type="button">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-groupd">
            <label>Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
              placeholder="Enter company name"
              disabled={loading}
            />
          </div>

          <div className="form-groupd">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="company@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-groupd">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+961 XX XXX XXX"
              disabled={loading}
            />
          </div>

          <div className="form-groupd">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Minimum 6 characters"
              minLength="6"
              disabled={loading}
            />
          </div>

          <div
            className="modal-actions"
            style={{
              width: "100",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <button type="submit" className="btn-submitd" disabled={loading}>
              {loading ? "Adding..." : "Add Company"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
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

export default AddCompanyModal;
