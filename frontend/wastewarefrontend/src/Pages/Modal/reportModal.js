import React, { useEffect } from "react";
import "../../Styles/Page/reportModal.css";

const ReportModal = ({
  isOpen,
  onClose,
  report,
  loading = false,
  error = null,
  user,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  if (!isOpen) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "reviewed":
        return "#3b82f6";
      case "resolved":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getSeverityColor = (level) => {
    switch (level) {
      case 1:
        return "#10b981";
      case 2:
        return "#f59e0b";
      case 3:
        return "#f97316";
      case 4:
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "routine":
        return "#10b981";
      case "moderate":
        return "#f59e0b";
      case "high":
        return "#f97316";
      case "emergency":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div
      className="report-modal-overlay"
      onMouseDown={(e) => {
        if (e.target.classList.contains("report-modal-overlay")) onClose();
      }}
    >
      <div className="report-modal-panel" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="report-modal-header">
          <div className="report-modal-header-content">
            <i className="fa-solid fa-file-lines report-modal-icon"></i>
            <h2>
              Report Details
              {report && (
                <span className="report-modal-id">#{report.report_id}</span>
              )}
            </h2>
          </div>
          <button
            className="report-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div className="report-modal-body">
          {loading ? (
            <div className="report-modal-loading">
              <i className="fa-solid fa-spinner fa-spin fa-3x"></i>
              <p>Loading report details...</p>
            </div>
          ) : error ? (
            <div className="report-modal-error">
              <i className="fa-solid fa-triangle-exclamation fa-3x"></i>
              <p>{error}</p>
            </div>
          ) : report ? (
            <div className="report-modal-content">
              {/* Title Card */}
              <div className="report-card report-card-title">
                <h3 className="report-title">{report.title}</h3>
              </div>

              {/* Status & Type Row */}
              <div className="report-info-grid">
                <div className="report-card">
                  <div className="report-card-label">
                    <i className="fa-solid fa-circle-info"></i>
                    Status
                  </div>
                  <div
                    className="report-badge"
                    style={{
                      background: getStatusColor(report.status),
                    }}
                  >
                    {report.status_display || report.status}
                  </div>
                </div>

                <div className="report-card">
                  <div className="report-card-label">
                    <i className="fa-solid fa-tag"></i>
                    Type
                  </div>
                  <div className="report-value">
                    {report.type_display || report.type_of_report}
                  </div>
                </div>
              </div>

              {/* Severity & Priority Row */}
              {(report.severity_level || report.response_priority) && (
                <div className="report-info-grid">
                  {report.severity_level && (
                    <div className="report-card">
                      <div className="report-card-label">
                        <i className="fa-solid fa-exclamation-triangle"></i>
                        Severity
                      </div>
                      <div
                        className="report-badge"
                        style={{
                          background: getSeverityColor(report.severity_level),
                        }}
                      >
                        Level {report.severity_level}
                      </div>
                    </div>
                  )}

                  {report.response_priority && (
                    <div className="report-card">
                      <div className="report-card-label">
                        <i className="fa-solid fa-flag"></i>
                        Priority
                      </div>
                      <div
                        className="report-badge"
                        style={{
                          background: getPriorityColor(
                            report.response_priority
                          ),
                        }}
                      >
                        {report.response_priority}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dates Row */}
              <div className="report-info-grid">
                <div className="report-card">
                  <div className="report-card-label">
                    <i className="fa-solid fa-calendar-plus"></i>
                    Created
                  </div>
                  <div className="report-value">
                    {new Date(report.created_at).toLocaleString()}
                  </div>
                </div>

                {report.resolved_at && (
                  <div className="report-card">
                    <div className="report-card-label">
                      <i className="fa-solid fa-calendar-check"></i>
                      Resolved
                    </div>
                    <div className="report-value">
                      {new Date(report.resolved_at).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Location */}
                {report.location && (
                  <div className="report-card">
                    <div className="report-card-label">
                      <i className="fa-solid fa-location-dot"></i>
                      Location
                    </div>
                    <div className="report-value">{report.location}</div>
                  </div>
                )}
              </div>

              {/* Reporter Info - Always show this card */}
              <div className="report-card report-card-user">
                <div className="report-card-label">
                  <i className="fa-solid fa-user-circle"></i>
                  Reported By
                </div>
                {report.user ? (
                  <div className="user-info-container">
                    <div className="user-avatar">
                      {report.user.profile_image ? (
                        <img
                          src={
                            report.user.profile_image === ""
                              ? "https://ui-avatars.com/api/?name=User&background=random"
                              : `https://wasteware-project-production.up.railway.app${report.user.profile_image}`
                          }
                          alt={`${report.user.first_name} ${report.user.last_name}`}
                          className="user-avatar-image"
                        />
                      ) : (
                        <i className="fa-solid fa-user"></i>
                      )}
                    </div>
                    <div className="user-details">
                      {(report.user.first_name || report.user.last_name) && (
                        <div className="user-name">
                          {report.user.first_name} {report.user.last_name}
                        </div>
                      )}
                      {report.user.email && (
                        <div className="user-email">
                          <i className="fa-solid fa-envelope"></i>
                          {report.user.email}
                        </div>
                      )}
                      {report.user.phone_number && (
                        <div className="user-phone">
                          <i className="fa-solid fa-phone"></i>
                          {report.user.phone_number}
                        </div>
                      )}
                      {!report.user.first_name &&
                        !report.user.last_name &&
                        !report.user.email && (
                          <div className="user-id">
                            User ID: #{report.user.user_id}
                          </div>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="user-info-container">
                    <div className="user-avatar">
                      <i className="fa-solid fa-user-slash"></i>
                    </div>
                    <div className="user-details">
                      <div className="user-name" style={{ color: "#ef4444" }}>
                        User information not available
                      </div>
                      <div
                        className="user-email"
                        style={{ color: "#6b7280", fontSize: "0.85rem" }}
                      >
                        <i className="fa-solid fa-info-circle"></i>
                        The API may not be including user data. Check your
                        serializer.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {report.description && (
                <div className="report-card report-card-description">
                  <div className="report-card-label">
                    <i className="fa-solid fa-align-left"></i>
                    Description
                  </div>
                  <div className="report-description">{report.description}</div>
                </div>
              )}

              {/* Image Section - handles both images array and single image_url */}
              <div className="report-card">
                <div className="report-card-label">
                  <i className="fa-solid fa-image"></i>
                  Attached Image
                </div>
                <div className="report-images">
                  {report.image_url ? (
                    /* Handle single image_url - construct full URL */
                    <div className="report-image-wrapper">
                      <img
                        src={report.image_url}
                        alt="Report attachment"
                        className="report-image"
                        onClick={() => window.open(report.image_url, "_blank")}
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            '<div class="report-image-placeholder"><i class="fa-solid fa-image"></i><span>Image failed to load</span></div>';
                        }}
                      />
                    </div>
                  ) : (
                    /* Show placeholder if no image */
                    <div className="report-image-wrapper">
                      <div className="report-image-placeholder">
                        <i className="fa-solid fa-image"></i>
                        <span>No image available</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="report-modal-error">
              <i className="fa-solid fa-inbox fa-3x"></i>
              <p>No report data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="report-modal-footer">
          <button className="report-modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
