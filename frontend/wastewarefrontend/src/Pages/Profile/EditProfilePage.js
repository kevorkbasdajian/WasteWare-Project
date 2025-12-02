import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { AuthContext } from "../../Components/AuthProvider";
import * as Yup from "yup";
import "../../Styles/Page/editProfile.css";

// Validation Schema
const profileValidationSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .required("Full name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .min(8, "Phone number must be at least 8 digits"),
  address: Yup.string().max(100, "Address must be less than 100 characters"),
  badge: Yup.string().max(100, "Bio must be less than 100 characters"),
});

const EditProfilePage = () => {
  const { accessToken, userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(
    "https://i.pravatar.cc/150?img=12"
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [fetchImage, setFetchImage] = useState(false);
  const fileInputRef = useRef(null);

  const [initialValues, setInitialValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    badge: "",
  });

  // ========================================
  // FETCH PROFILE DATA
  // ========================================
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    if (userData) {
      setInitialValues({
        fullName: userData.name || "",
        email: userData.email || "",
        phone: userData.phone_number || "",
        address: userData.address || "",
        badge: userData.badge || "",
      });

      if (userData.avatar) setAvatarPreview(userData.avatar);
      setLoading(false);
    }
  }, [userData, accessToken, navigate]);

  // Avatar handlers
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);

      setAvatarFile(file);
      setError("");
      setFetchImage(true);
    }
  };

  // ========================================
  // SUBMIT HANDLER
  // ========================================
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();

      // Split full name into first + last
      const [first_name, ...rest] = values.fullName.split(" ");
      const last_name = rest.join(" ") || "";

      formData.append("first_name", first_name);
      formData.append("last_name", last_name);
      formData.append("email", values.email);
      formData.append("phone_number", values.phone);

      // Badge (your "bio" input)
      formData.append("badge", values.badge);

      // Address (your backend expects a dict, but FormData sends individually)
      formData.append("address.street", values.street || "");
      formData.append("address.city", values.city || "");
      formData.append("address.region", values.region || "");

      // Image (optional)
      if (avatarFile) {
        formData.append("profile_image", avatarFile);
      }

      const response = await fetch(
        "http://localhost:8000/api/auth/profile/update/",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Profile updated successfully");
        navigate("/client/profile");
      } else {
        alert("Failed: " + JSON.stringify(data.error));
      }
    } catch (error) {
      alert("Server error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/client/profile");

  if (loading) {
    return (
      <div className="edit-profile-page">
        <div className="edit-profile-container">
          <p>Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <Formik
          initialValues={initialValues}
          validationSchema={profileValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting, setStatus, status }) => (
            <>
              {/* LEFT SIDE */}
              <div className="edit-profile-sidebar">
                <div className="edit-profile-avatar-wrapper">
                  <img
                    src={
                      !fetchImage
                        ? `http://localhost:8000${userData.avatar}`
                        : avatarPreview
                    }
                    alt="Profile"
                    className="edit-profile-avatar"
                  />
                  <button
                    className="avatar-edit-icon"
                    type="button"
                    onClick={handleAvatarClick}
                    title="Change profile photo"
                  >
                    📷
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>

                <h2 className="edit-profile-name">{values.fullName}</h2>
                <p className="edit-profile-email">{values.email}</p>

                <div className="edit-profile-bio">
                  <p>{values.badge}</p>
                  <span className="bio-char-count">
                    {values.badge.length}/100
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="edit-profile-form-wrapper">
                {error && <div className="error-message">{error}</div>}
                {status && status.message && (
                  <div
                    className={`status-message ${
                      status.success ? "success" : "error"
                    }`}
                  >
                    {status.message}
                  </div>
                )}

                <Form className="edit-profile-form">
                  {/* Full Name */}
                  <div className="form-field-row">
                    <label className="form-label-col">Full Name</label>
                    <div className="form-input-col">
                      <Field
                        type="text"
                        name="fullName"
                        placeholder="Enter your full name"
                        className={
                          errors.fullName && touched.fullName ? "error" : ""
                        }
                      />
                      <ErrorMessage
                        name="fullName"
                        component="div"
                        className="field-error"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="form-field-row">
                    <label className="form-label-col">Email</label>
                    <div className="form-input-col">
                      <Field
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        className={errors.email && touched.email ? "error" : ""}
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="field-error"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="form-field-row">
                    <label className="form-label-col">Phone Number</label>
                    <div className="form-input-col">
                      <Field
                        type="tel"
                        name="phone"
                        placeholder="Enter your phone number"
                        className={errors.phone && touched.phone ? "error" : ""}
                      />
                      <ErrorMessage
                        name="phone"
                        component="div"
                        className="field-error"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="form-field-row">
                    <label className="form-label-col">Address</label>
                    <div className="form-input-col">
                      <Field
                        type="text"
                        name="address"
                        placeholder="Enter your address"
                        className={
                          errors.address && touched.address ? "error" : ""
                        }
                      />
                      <ErrorMessage
                        name="address"
                        component="div"
                        className="field-error"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="form-field-row about-me-row">
                    <label className="form-label-col">About Me</label>
                    <div className="form-input-col">
                      <Field
                        as="textarea"
                        name="badge"
                        placeholder="Tell us about yourself"
                        rows={2}
                        className={errors.badge && touched.badge ? "error" : ""}
                      />
                      <span className="char-count-inline">
                        {values.badge.length}/100
                      </span>
                      <ErrorMessage
                        name="badge"
                        component="div"
                        className="field-error"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Submit"}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-gray"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              </div>
            </>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EditProfilePage;
