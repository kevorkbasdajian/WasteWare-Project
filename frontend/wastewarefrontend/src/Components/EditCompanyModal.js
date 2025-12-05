import React, { useState, useEffect } from "react";
import "../Styles/Page/Admin/companyModal.css";
import { useFetchWithAuth } from "./fetchWithAuth";
const EditCompanyModal = ({ isOpen, onClose, company, onCompanyUpdated }) => {
  const fetchWithAuth = useFetchWithAuth();

  const [formData, setFormData] = useState({
    company_name: "",
    phone_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill form when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name || "",
        phone_number: company.phone_number || "",
      });
    }
  }, [company]);

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
        `http://localhost:8000/api/auth/admin/companies/${company.company_id}/`,
        {
          method: "PUT",
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
          setError(data.detail || "Failed to update company");
        }
        setLoading(false);
        return;
      }

      // Success! Update company in list
      onCompanyUpdated(data.company);

      setLoading(false);

      // Close modal
      onClose();
    } catch (err) {
      console.error("Error updating company:", err);
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!isOpen || !company) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Company</h2>
          <button className="modal-close" onClick={handleClose} type="button">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-forms">
          <div className="form-groupss">
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

          <div className="form-groupss">
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

          <div
            className="modal-actions"
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <button type="submit" className="btn-submits" disabled={loading}>
              {loading ? "Updating..." : "Update Company"}
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

export default EditCompanyModal;
