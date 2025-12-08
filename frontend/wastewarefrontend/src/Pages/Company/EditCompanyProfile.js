import React, { useState, useEffect, useRef, useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../../Styles/Page/editProfile.css";
import AlertSnackbar from "../../Components/Alert.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";

// Validation Schema
const companyValidationSchema = Yup.object().shape({
  companyName: Yup.string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters")
    .required("Company name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .min(8, "Phone number must be at least 8 digits"),
  city: Yup.string().max(100, "City name is too long"),
  region: Yup.string().max(100, "Region name is too long"),
});

const EditCompanyProfileModal = ({ isOpen, onClose, onSuccess }) => {
  const { refreshUserData } = useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();

  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(
    "https://ui-avatars.com/api/?name=Company&background=10B981&color=fff&size=150"
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [fetchImage, setFetchImage] = useState(false);
  const fileInputRef = useRef(null);

  const [initialValues, setInitialValues] = useState({
    companyName: "",
    email: "",
    phone: "",
    city: "",
    region: "",
  });

  // Fetch profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

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

      setInitialValues({
        companyName: data.company_name || "",
        email: data.email || "",
        phone: data.phone_number || "",
        city: data.address?.city || "",
        region: data.address?.region || "",
      });

      // Set avatar preview if exists
      if (data.avatar) {
        setAvatarPreview(`http://localhost:8000${data.avatar}`);
      } else {
        setAvatarPreview(
          "https://ui-avatars.com/api/?name=Company&background=10B981&color=fff&size=150"
        );
      }
      setFetchImage(false);
      setRemoveImage(false);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    }
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

      // Store file
      setAvatarFile(file);
      setRemoveImage(false);
      setFetchImage(true);
      setError("");
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setAvatarPreview(
      "https://ui-avatars.com/api/?name=Company&background=10B981&color=fff&size=150"
    );
    setAvatarFile(null);
    setFetchImage(false);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(""); // Clear previous errors

      // Create FormData for file upload
      const formDataToSend = new FormData();

      formDataToSend.append("company_name", values.companyName);
      formDataToSend.append("email", values.email);
      formDataToSend.append("phone_number", values.phone);
      formDataToSend.append("city", values.city);
      formDataToSend.append("region", values.region);

      // Image handling
      if (removeImage) {
        formDataToSend.append("remove_avatar", "true");
      } else if (avatarFile) {
        formDataToSend.append("profile_image", avatarFile);
      }

      const response = await fetchWithAuth(
        "http://localhost:8000/api/auth/company/profile/",
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Profile updated:", result);

        // Refresh user data in context if available
        if (refreshUserData) {
          await refreshUserData();
        }

        setSnackbar(true);

        // Call success callback and close modal after short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          handleClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to update profile. Please try again.");
      }
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error("Update error:", err);
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
      <div className="edit-modal-overlay" onClick={handleClose}>
        <div
          className="edit-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button className="edit-modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>

          {/* Modal Header */}
          <div className="edit-modal-header">
            <h2>Edit Company Profile</h2>
            <p>Update your company information and settings</p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={companyValidationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, isSubmitting }) => (
              <div className="edit-modal-body">
                {/* LEFT SIDEBAR */}
                <div className="edit-modal-sidebar">
                  <div className="edit-modal-avatar-wrapper">
                    <img
                      src={
                        !fetchImage && !removeImage
                          ? avatarPreview.includes("http://localhost:8000")
                            ? avatarPreview
                            : avatarPreview.includes("ui-avatars.com")
                            ? avatarPreview
                            : `http://localhost:8000${avatarPreview}`
                          : avatarPreview
                      }
                      alt="Company Logo"
                      className="edit-modal-avatar"
                    />
                    <div className="avatar-actions">
                      <button
                        className="avatar-edit-icon"
                        type="button"
                        onClick={handleAvatarClick}
                        title="Change company logo"
                      >
                        <i className="fas fa-camera"></i>
                      </button>
                      {(avatarFile ||
                        (!removeImage &&
                          !avatarPreview.includes("ui-avatars.com"))) && (
                        <button
                          className="avatar-remove-icon"
                          type="button"
                          onClick={handleRemoveImage}
                          title="Remove company logo"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </div>
                  <h2 className="modal-profile-name">{values.companyName}</h2>
                  <p className="modal-profile-email">{values.email}</p>
                </div>

                {/* RIGHT SIDE - FORM */}
                <div className="modal-form-wrapper">
                  {error && <div className="error-message">{error}</div>}

                  <Form className="modal-form">
                    {/* Company Name */}
                    <div className="form-field-row">
                      <label className="form-label-col">Company Name</label>
                      <div className="form-input-col">
                        <Field
                          type="text"
                          name="companyName"
                          placeholder="Enter company name"
                          className={
                            errors.companyName && touched.companyName
                              ? "error"
                              : ""
                          }
                        />
                        <ErrorMessage
                          name="companyName"
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
                          placeholder="Enter email"
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

                    {/* Phone Number */}
                    <div className="form-field-row">
                      <label className="form-label-col">Phone Number</label>
                      <div className="form-input-col">
                        <Field
                          type="tel"
                          name="phone"
                          placeholder="Enter phone number"
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

                    {/* City and Region in a row */}
                    <div className="form-field-row-group">
                      {/* City */}
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

                      {/* Region */}
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
        message="Company profile updated successfully!"
        severity="success"
        autoHideDuration={3000}
      />
    </>
  );
};

export default EditCompanyProfileModal;
