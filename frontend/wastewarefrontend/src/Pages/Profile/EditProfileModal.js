import React, { useState, useEffect, useRef, useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import AlertSnackbar from "../../Components/Alert.js";
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
  badge: Yup.string().max(100, "Bio must be less than 100 characters"),
  // Address fields
  coordinates: Yup.string().matches(
    /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/,
    "Coordinates must be in format: latitude, longitude"
  ),
  street: Yup.string().max(200, "Street address is too long"),
  city: Yup.string().max(100, "City name is too long"),
  region: Yup.string().max(100, "Region name is too long"),
  postalCode: Yup.string().max(20, "Postal code is too long"),
});

const EditProfileModal = ({ isOpen, onClose, onSuccess }) => {
  const { accessToken, userData, refreshUserData } = useContext(AuthContext);

  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(
    "https://ui-avatars.com/api/?name=User&background=random"
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [fetchImage, setFetchImage] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [autoGPS, setAutoGPS] = useState(false);
  const [snackbar, setSnackbar] = useState(false);
  const fileInputRef = useRef(null);

  const [initialValues, setInitialValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    badge: "",
    coordinates: "",
    street: "",
    city: "",
    region: "",
    postalCode: "",
  });

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen && userData) {
      // Set coordinates from address if available
      console.log(userData);
      let coords = "";
      if (userData.address?.latitude && userData.address?.longitude) {
        coords = `${userData.address.latitude}, ${userData.address.longitude}`;
      }
      setInitialValues({
        fullName: userData.name || "",
        email: userData.email || "",
        phone: userData.phone_number || "",
        badge: userData.badge || "",
        coordinates: coords,
        street: userData.address?.street || "",
        city: userData.address?.city || "",
        region: userData.address?.region || "",
        postalCode: userData.address?.postal_code || "",
      });

      if (userData.avatar) {
        setAvatarPreview(userData.avatar);
      }
      setFetchImage(false);
      setRemoveImage(false);
    }
  }, [isOpen, userData]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
      setRemoveImage(false);
      setError("");
      setFetchImage(true);
    }
  };

  const handleRemoveImage = () => {
    setAvatarPreview("https://ui-avatars.com/api/?name=User&background=random");
    setAvatarFile(null);
    setFetchImage(false);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // GPS handler
  const handleAutoGPS = (e, setFieldValue) => {
    const isChecked = e.target.checked;
    setAutoGPS(isChecked);

    if (isChecked && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude.toFixed(
            4
          )}, ${position.coords.longitude.toFixed(4)}`;
          setFieldValue("coordinates", coords);
        },
        (error) => {
          console.error("GPS error:", error);
          setError("Unable to get your location. Please enter manually.");
        }
      );
    }
  };

  // Submit handler
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(""); // Clear previous errors
      const formData = new FormData();

      // Split full name into first + last
      const [first_name, ...rest] = values.fullName.split(" ");
      const last_name = rest.join(" ") || "";

      formData.append("first_name", first_name);
      formData.append("last_name", last_name);
      formData.append("email", values.email);
      formData.append("phone_number", values.phone);
      formData.append("badge", values.badge);

      // Address fields
      if (values.street) formData.append("street", values.street);
      if (values.city) formData.append("city", values.city);
      if (values.region) formData.append("region", values.region);
      if (values.postalCode) formData.append("postal_code", values.postalCode);

      // Parse coordinates
      if (values.coordinates) {
        try {
          const [lat, lng] = values.coordinates
            .split(",")
            .map((c) => parseFloat(c.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            formData.append("latitude", lat);
            formData.append("longitude", lng);
          }
        } catch (error) {
          console.error("Error parsing coordinates:", error);
        }
      }

      // Image handling
      if (removeImage) {
        formData.append("remove_avatar", "true");
      } else if (avatarFile) {
        formData.append("profile_image", avatarFile);
      }

      const response = await fetch(
        "https://wasteware-project-production.up.railway.app/api/auth/profile/update/",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Response status:", response.ok);
      console.log("Response data:", data);

      if (response.ok && data.success) {
        console.log("Update successful, showing snackbar");

        // Refresh user data if function exists
        if (refreshUserData) {
          await refreshUserData();
        }

        setSnackbar(true);

        // Call success callback and close modal after short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Failed to update profile. Please try again.");
      }
    } catch (error) {
      setError("Failed to update profile. Please try again.");
      console.error("Update error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setError("");
    setAvatarFile(null);
    setRemoveImage(false);
    if (onClose) {
      onClose();
    }
  };

  const closeSnackbar = () => {
    setSnackbar(false);
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      <div className="edit-modal-overlay" onClick={onClose}>
        <div
          className="edit-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="edit-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>

          <div className="edit-modal-header">
            <h2>Edit Profile</h2>
            <p>Update your personal information and preferences</p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={profileValidationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, isSubmitting, setFieldValue }) => (
              <div className="edit-modal-body">
                {/* LEFT SIDE */}
                <div className="edit-modal-sidebar">
                  <div className="edit-modal-avatar-wrapper">
                    <img
                      src={
                        !fetchImage && !removeImage
                          ? userData.avatar === "" || !userData.avatar
                            ? "https://ui-avatars.com/api/?name=User&background=random"
                            : `https://wasteware-project-production.up.railway.app${userData.avatar}`
                          : avatarPreview
                      }
                      alt="Profile"
                      className="edit-modal-avatar"
                    />
                    <div className="avatar-actions">
                      <button
                        className="avatar-edit-icon"
                        type="button"
                        onClick={handleAvatarClick}
                        title="Change profile photo"
                      >
                        <i className="fas fa-camera"></i>
                      </button>
                      {(userData.avatar || avatarFile) && !removeImage && (
                        <button
                          className="avatar-remove-icon"
                          type="button"
                          onClick={handleRemoveImage}
                          title="Remove profile photo"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </div>

                  <h3 className="modal-profile-name">{values.fullName}</h3>
                  <p className="modal-profile-email">{values.email}</p>

                  <div className="modal-profile-bio">
                    <p>{values.badge || "No bio yet"}</p>
                    <span className="bio-char-count">
                      {values.badge.length}/100
                    </span>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="modal-form-wrapper">
                  {error && <div className="error-message">{error}</div>}

                  <Form className="modal-form">
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
                          className={
                            errors.email && touched.email ? "error" : ""
                          }
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
                          className={
                            errors.phone && touched.phone ? "error" : ""
                          }
                        />
                        <ErrorMessage
                          name="phone"
                          component="div"
                          className="field-error"
                        />
                      </div>
                    </div>

                    {/* ADDRESS SECTION */}
                    <div className="form-section-divider">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>Location Information (Optional)</span>
                    </div>

                    {/* GPS Toggle */}
                    <div className="form-field-row">
                      <label className="form-label-col">Auto GPS</label>
                      <div className="form-input-col">
                        <label className="toggle-container-modal">
                          <input
                            type="checkbox"
                            checked={autoGPS}
                            onChange={(e) => handleAutoGPS(e, setFieldValue)}
                          />
                          <span className="toggle-slider-modal"></span>
                        </label>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="form-field-row">
                      <label className="form-label-col">Coordinates</label>
                      <div className="form-input-col">
                        <div className="input-with-icon">
                          <i className="fas fa-location-dot input-icon"></i>
                          <Field
                            type="text"
                            name="coordinates"
                            placeholder="latitude, longitude"
                            disabled={autoGPS}
                            className={
                              errors.coordinates && touched.coordinates
                                ? "error"
                                : ""
                            }
                          />
                        </div>
                        <ErrorMessage
                          name="coordinates"
                          component="div"
                          className="field-error"
                        />
                      </div>
                    </div>

                    {/* Street Address */}
                    <div className="form-field-row">
                      <label className="form-label-col">Street Address</label>
                      <div className="form-input-col">
                        <Field
                          type="text"
                          name="street"
                          placeholder="Enter your street address"
                          className={
                            errors.street && touched.street ? "error" : ""
                          }
                        />
                        <ErrorMessage
                          name="street"
                          component="div"
                          className="field-error"
                        />
                      </div>
                    </div>

                    {/* City and Region */}
                    <div className="form-field-row-group">
                      <div className="form-field-row">
                        <label className="form-label-col">City</label>
                        <div className="form-input-col">
                          <Field
                            as="select"
                            name="city"
                            className={
                              errors.city && touched.city ? "error" : ""
                            }
                          >
                            <option value="">Select City</option>
                            <option value="Beirut">Beirut</option>
                            <option value="Tripoli">Tripoli</option>
                            <option value="Sidon">Sidon</option>
                            <option value="Metn">Metn</option>
                            <option value="Tyre">Tyre</option>
                            <option value="Zahle">Zahle</option>
                          </Field>
                          <ErrorMessage
                            name="city"
                            component="div"
                            className="field-error"
                          />
                        </div>
                      </div>

                      <div className="form-field-row">
                        <label className="form-label-col">Governorate</label>
                        <div className="form-input-col">
                          <Field
                            as="select"
                            name="region"
                            className={
                              errors.region && touched.region ? "error" : ""
                            }
                          >
                            <option value="">Select Governorate</option>
                            <option value="Beirut">Beirut</option>
                            <option value="North">North Lebanon</option>
                            <option value="South">South Lebanon</option>
                            <option value="Mount Lebanon">Mount Lebanon</option>
                            <option value="Bekaa">Bekaa</option>
                            <option value="Nabatieh">Nabatieh</option>
                          </Field>
                          <ErrorMessage
                            name="region"
                            component="div"
                            className="field-error"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Postal Code */}
                    <div className="form-field-row">
                      <label className="form-label-col">Postal Code</label>
                      <div className="form-input-col">
                        <Field
                          type="text"
                          name="postalCode"
                          placeholder="Enter postal code"
                          className={
                            errors.postalCode && touched.postalCode
                              ? "error"
                              : ""
                          }
                        />
                        <ErrorMessage
                          name="postalCode"
                          component="div"
                          className="field-error"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="form-field-row">
                      <label className="form-label-col">About Me</label>
                      <div className="form-input-col">
                        <Field
                          as="textarea"
                          name="badge"
                          placeholder="Tell us about yourself"
                          rows={3}
                          className={
                            errors.badge && touched.badge ? "error" : ""
                          }
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
                        {isSubmitting ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i>
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-cancel-gray"
                        onClick={handleClose}
                        disabled={isSubmitting}
                      >
                        <i className="fas fa-times"></i>
                        Cancel
                      </button>
                    </div>
                  </Form>
                </div>
              </div>
            )}
          </Formik>
        </div>
      </div>

      <AlertSnackbar
        open={snackbar}
        onClose={closeSnackbar}
        message="Your profile updated successfully!"
        severity="success"
        autoHideDuration={3000}
      />
    </>
  );
};

export default EditProfileModal;
