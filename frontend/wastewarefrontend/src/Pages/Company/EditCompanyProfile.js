import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Page/editProfile.css";
import CompanySidebar from "../../Components/CompanySidebar";
import AlertSnackbar from "../../Components/Alert.js";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";

const EditCompanyProfile = () => {
  const { clearAuth, accessToken, user_type } = useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setsnackbar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(
    "https://via.placeholder.com/150/10B981/FFFFFF?text=C"
  );
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    companyName: "",
    contactPersonName: "",
    email: "",
    phone: "",
    city: "",
    area: "",
    avatar: null,
  });

  const links = [
    {
      name: "Home",
      path: "/company",
      color: "var(--gradient-red)",
      glowColor: "#EF4444",
      icon: "fa-solid fa-house fa-lg",
    },
    {
      name: "Routes",
      path: "/company/routes",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: "fa-solid fa-map-location-dot fa-lg",
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-calendar fa-lg",
    },
    {
      name: "Pickups",
      path: "/company/pickups",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: "fa-solid fa-gift fa-lg",
    },
    {
      name: "Reports",
      path: "/company/reports",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-camera fa-lg",
    },
    {
      name: "Notifications",
      path: "/company/notifications",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: "fa-solid fa-bell fa-lg",
    },
  ];

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate]);
  // useEffect(() => {
  //   if (user_type && user_type !== "company" && user_type !== "admin") {
  //     navigate(-1);
  //   }
  // }, [navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetchWithAuth(
          "http://localhost:8000/api/auth/company/profile/",
          {
            method: "GET",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        const transformedData = {
          companyName: data.company_name,
          email: data.email,
          phone: data.phone_number || "",
          city: data.address.city || "",
          region: data.address.region || "",
        };

        setFormData(transformedData);
        // setAvatarPreview(data.avatar);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        setError("Image size must be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Store file in formData
      setFormData((prev) => ({
        ...prev,
        avatar: file,
      }));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();

      formDataToSend.append("company_name", formData.companyName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone_number", formData.phone);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("region", formData.region);

      // Add avatar file if selected
      if (formData.avatar) {
        formDataToSend.append("profile_image", formData.avatar);
      }

      const response = await fetchWithAuth(
        "http://localhost:8000/api/auth/company/profile/",
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const result = await response.json();
      console.log("Profile updated:", result);
      navigate("/company/profile");
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/company/profile");
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      clearAuth();
      navigate("/Login");
    }
  };

  const closesnackbar = () => {
    setsnackbar(false);
  };
  return (
    <>
      {/* <CompanySidebar /> */}
      <Navbar
        links={links}
        onLogout={handleLogout}
        profilePath="/company/profile"
      />

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
                style={{ display: "none" }}
              />
            </div>
            <h2 className="edit-profile-name">{formData.companyName}</h2>
            <p className="edit-profile-email">{formData.email}</p>
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="edit-profile-form-wrapper" style={{ width: "100%" }}>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="edit-profile-form">
              {/* Company Name */}
              <div className="form-field-row" style={{ width: "100%" }}>
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

              {/* Email */}
              <div className="form-field-row" style={{ width: "100%" }}>
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
              <div className="form-field-row" style={{ width: "100%" }}>
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
              <div className="form-field-row" style={{ width: "100%" }}>
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
              <div className="form-field-row" style={{ width: "100%" }}>
                <label className="form-label-col">Region</label>
                <div className="form-input-col">
                  <input
                    type="text"
                    name="area"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="Enter area/address"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div
                className="form-actions"
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Saving..." : "Submit"}
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
        <AlertSnackbar
          open={snackbar}
          onClose={closesnackbar}
          message="Company profile updated successfully!"
          severity="success"
          autoHideDuration={3000}
        />
      </div>
    </>
  );
};

export default EditCompanyProfile;
