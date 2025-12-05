import React, { useContext, useEffect, useState } from "react";
import "../../Styles/Page/companyNotifications.css";

import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
import AlertSnackbar from "../../Components/Alert.js";

const CompanyNotifications = () => {
  const { clearAuth, accessToken, user_type } = useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();
  const navigate = useNavigate();

  const [snackbar, setSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal",
    type: "system",
    target_audience: "all_users",
    target_user_ids: [],
  });

  // UI state
  const [sending, setSending] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showUserSelector, setShowUserSelector] = useState(false);

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
    if (!accessToken) {
      navigate("/Login", { replace: true });
    }
  }, [navigate, accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchRecentNotifications();
    }
  }, [accessToken]);

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

  const fetchRecentNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/auth/notifications/"
      );
      if (response.ok) {
        const data = await response.json();
        setRecentNotifications(data.slice(0, 10)); // Last 10 notifications
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchUsers = async (search = "") => {
    setLoadingUsers(true);
    try {
      const url = search
        ? `http://localhost:8000/api/auth/users/?search=${encodeURIComponent(
            search
          )}`
        : "http://localhost:8000/api/auth/users/";

      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Show user selector when custom is selected
    if (name === "target_audience") {
      if (value === "custom" && availableUsers.length === 0) {
        fetchUsers();
      }
      setShowUserSelector(value === "custom");
    }
  };

  const handleUserSearch = (e) => {
    const search = e.target.value;
    setUserSearch(search);
    if (search.length >= 2) {
      fetchUsers(search);
    } else if (search.length === 0) {
      fetchUsers();
    }
  };

  const toggleUserSelection = (userId) => {
    setFormData((prev) => {
      const isSelected = prev.target_user_ids.includes(userId);
      return {
        ...prev,
        target_user_ids: isSelected
          ? prev.target_user_ids.filter((id) => id !== userId)
          : [...prev.target_user_ids, userId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showSnackbar("Please enter a notification title", "error");
      return;
    }

    if (
      formData.target_audience === "custom" &&
      formData.target_user_ids.length === 0
    ) {
      showSnackbar("Please select at least one user", "error");
      return;
    }

    setSending(true);

    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/auth/notifications/send_notification/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        showSnackbar(
          result.message || "Notification sent successfully!",
          "success"
        );

        // Reset form
        setFormData({
          title: "",
          message: "",
          priority: "normal",
          type: "system",
          target_audience: "all_users",
          target_user_ids: [],
        });
        setShowUserSelector(false);
        setUserSearch("");

        // Refresh recent notifications
        fetchRecentNotifications();
      } else {
        const errorData = await response.json();
        showSnackbar(
          errorData.detail || "Failed to send notification",
          "error"
        );
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      showSnackbar("Failed to send notification. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbar(true);
  };

  const closeSnackbar = () => {
    setSnackbar(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#EF4444";
      case "normal":
        return "#F59E0B";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="skeleton">
      <Navbar links={links} onLogout={handleLogout} />
      <HeaderBox
        text="Notifications"
        gradientColors={["#0288D1 30%", "#26C6DA 100%"]}
      />

      <div className="notifications-page-container">
        {/* Left Side - Create Notification Form */}
        <div className="notification-form-section">
          <div className="form-card">
            <h2 className="form-title">Create a Notification</h2>

            <form onSubmit={handleSubmit}>
              {/* Title Input */}
              <div className="form-groups">
                <label htmlFor="title">Notification Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter notification title"
                  required
                  className="form-input"
                />
              </div>

              {/* Message Input */}
              <div className="form-groups">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter your message (optional)"
                  rows="4"
                  className="form-textarea"
                />
              </div>

              {/* Priority and Type Row */}
              <div className="form-rows">
                <div className="form-groups">
                  <label htmlFor="priority">Priority *</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-groups">
                  <label htmlFor="type">Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="system">System</option>
                    <option value="alert">Alert</option>
                    <option value="reward">Reward</option>
                    <option value="report">Report</option>
                  </select>
                </div>
              </div>

              {/* Target Audience */}
              <div className="form-groups">
                <label htmlFor="target_audience">Target Audience *</label>
                <select
                  id="target_audience"
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="all_users">All Users</option>
                  <option value="custom">Custom Selection</option>
                </select>
              </div>

              {/* User Selector (shown when custom is selected) */}
              {showUserSelector && (
                <div className="user-selector-container">
                  <div className="user-search-box">
                    <i className="fa-solid fa-search"></i>
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={handleUserSearch}
                      className="user-search-input"
                    />
                  </div>

                  <div className="selected-count">
                    {formData.target_user_ids.length} user(s) selected
                  </div>

                  <div className="users-list">
                    {loadingUsers ? (
                      <div className="loading-users">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Loading users...</span>
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="no-users">No users found</div>
                    ) : (
                      availableUsers.map((user) => (
                        <div
                          key={user.user_id}
                          className={`user-item ${
                            formData.target_user_ids.includes(user.user_id)
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => toggleUserSelection(user.user_id)}
                        >
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.first_name.charAt(0)}
                              {user.last_name.charAt(0)}
                            </div>
                            <div className="user-details">
                              <div className="user-name">{user.full_name}</div>
                              <div className="user-email">{user.email}</div>
                            </div>
                          </div>
                          {formData.target_user_ids.includes(user.user_id) && (
                            <i className="fa-solid fa-check-circle selected-icon"></i>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending}
                className="submit-button"
              >
                {sending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    Send Notification
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Recent Notifications */}
        <div className="recent-notifications-section">
          <div className="recent-card">
            <h2 className="recent-title">Recent Notifications</h2>

            {loadingNotifications ? (
              <div className="loading-state">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading notifications...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-bell-slash"></i>
                <p>No notifications sent yet</p>
              </div>
            ) : (
              <div className="notifications-list">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className="notification-card"
                  >
                    <div className="notification-header">
                      <div className="notification-title-row">
                        <h3>{notification.title}</h3>
                        <span
                          className="priority-badge"
                          style={{
                            backgroundColor: getPriorityColor(
                              notification.priority
                            ),
                          }}
                        >
                          {notification.priority}
                        </span>
                      </div>
                      <span className="notification-date">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>

                    {notification.message && (
                      <p className="notification-message">
                        {notification.message}
                      </p>
                    )}

                    <div className="notification-footer">
                      <span className="notification-type">
                        <i className="fa-solid fa-tag"></i>
                        {notification.type}
                      </span>
                      <span className="notification-audience">
                        <i className="fa-solid fa-users"></i>
                        {notification.target_audience === "all_users"
                          ? "All Users"
                          : `${
                              notification.target_user_ids?.length || 0
                            } users`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertSnackbar
        open={snackbar}
        onClose={closeSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
        autoHideDuration={4000}
      />
    </div>
  );
};

export default CompanyNotifications;
