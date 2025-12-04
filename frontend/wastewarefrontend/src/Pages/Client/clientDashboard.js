import React, { useContext, useEffect, useState } from "react";
import "../../Styles/Page/clientDashboard.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider.js";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";

const Dashboard = () => {
  const { clearAuth, accessToken, user_type, userData, isLoadingUser } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const fetchWithAuth = useFetchWithAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  // Real notifications from backend
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const links = [
    {
      name: "Home",
      path: "/",
      color: "var(--gradient-red)",
      glowColor: "#EF4444",
      icon: "fa-solid fa-house fa-lg",
    },
    {
      name: "Map",
      path: "/client/map",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: "fa-solid fa-map-location-dot fa-lg",
    },
    {
      name: "Report",
      path: "/client/reports",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-camera fa-lg",
    },
  ];

  // Sample data for charts - replace with real data from your API
  const activityData = {
    week: [
      { day: "Mon", reports: 3 },
      { day: "Tue", reports: 5 },
      { day: "Wed", reports: 2 },
      { day: "Thu", reports: 7 },
      { day: "Fri", reports: 4 },
      { day: "Sat", reports: 6 },
      { day: "Sun", reports: 3 },
    ],
    month: [
      { day: "Week 1", reports: 15 },
      { day: "Week 2", reports: 22 },
      { day: "Week 3", reports: 18 },
      { day: "Week 4", reports: 25 },
    ],
    year: [
      { day: "Jan", reports: 45 },
      { day: "Feb", reports: 52 },
      { day: "Mar", reports: 61 },
      { day: "Apr", reports: 48 },
      { day: "May", reports: 70 },
      { day: "Jun", reports: 65 },
    ],
  };

  const nearbyCenters = [
    {
      id: 1,
      name: "Green Recycling Hub",
      distance: "0.8 km",
      type: "Recycling",
    },
    {
      id: 2,
      name: "EcoCenter Downtown",
      distance: "1.2 km",
      type: "Mixed Waste",
    },
    { id: 3, name: "CompostPro Station", distance: "2.1 km", type: "Organic" },
  ];

  const weeklySchedule = [
    {
      day: "Monday",
      task: "Recycling Collection",
      time: "8:00 AM",
      status: "completed",
    },
    {
      day: "Tuesday",
      task: "Community Clean-up",
      time: "3:00 PM",
      status: "upcoming",
    },
    {
      day: "Wednesday",
      task: "Organic Waste",
      time: "7:00 AM",
      status: "upcoming",
    },
    {
      day: "Friday",
      task: "E-Waste Drop-off",
      time: "10:00 AM",
      status: "upcoming",
    },
  ];

  // ALL HOOKS MUST COME BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (user_type && user_type !== "user") {
      navigate(-1);
    }
  }, [user_type, navigate]);

  // Fetch real notifications
  useEffect(() => {
    if (accessToken && user_type === "user") {
      fetchNotifications();
    }
  }, [accessToken, user_type]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/auth/notifications/"
      );
      if (response.ok) {
        const data = await response.json();
        // Get last 3 notifications for dashboard
        setNotifications(data.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const formatNotificationTime = (dateString) => {
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
    });
  };

  const getNotificationIcon = (type, priority) => {
    if (priority === "high") return "fa-exclamation-circle";
    switch (type) {
      case "alert":
        return "fa-bell";
      case "reward":
        return "fa-gift";
      case "report":
        return "fa-file-lines";
      default:
        return "fa-info-circle";
    }
  };

  const getNotificationType = (priority) => {
    switch (priority) {
      case "high":
        return "warning";
      case "low":
        return "success";
      default:
        return "info";
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/auth/notifications/${notificationId}/mark_as_read/`,
        {
          method: "PATCH",
        }
      );
      if (response.ok) {
        // Refresh notifications
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Calculate maxReports - safe to do after hooks
  const maxReports = Math.max(
    ...activityData[selectedPeriod].map((d) => d.reports)
  );

  // NOW you can have conditional returns
  if (isLoadingUser) {
    return (
      <div className="loading">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <p>Loading...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="error-page">
        <p>Unable to load user data</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar
        links={links}
        profilePath="/client/profile"
        profileImage={`http://localhost:8000${userData.avatar}`}
        onLogout={handleLogout}
      />

      <HeaderBox
        text={`Welcome Back, ${userData.name}!`}
        gradientColors={["#E53935", "#FF7043"]}
      />

      <div className="dashboard-container">
        {/* Stats Overview - Environmental Impact Style */}
        <div className="impact-section stats-section">
          <h2>Your Statistics Overview</h2>
          <div className="stats-grid">
            <div className="stat-card impact-style">
              <div className="stat-icon-large">
                <i className="fa-solid fa-chart-simple"></i>
              </div>
              <h3>{userData.stats?.reportsSubmitted || 0}</h3>
              <p>Reports Submitted</p>
            </div>

            <div className="stat-card impact-style">
              <div className="stat-icon-large">
                <i className="fa-solid fa-leaf"></i>
              </div>
              <h3>{userData.stats?.ecoPoints || 0}</h3>
              <p>EcoPoints</p>
            </div>

            <div className="stat-card impact-style">
              <div className="stat-icon-large">
                <i className="fa-solid fa-earth-americas"></i>
              </div>
              <h3>{userData.stats?.co2Reduced || 0}</h3>
              <p>Tons CO2 Reduced</p>
            </div>

            <div className="stat-card impact-style">
              <div className="stat-icon-large">
                <i className="fa-solid fa-calendar-days"></i>
              </div>
              <h3>{userData.stats?.daysActive || 0}</h3>
              <p>Days Active</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="main-content-grid">
          {/* Activity Chart */}
          <div className="chart-section">
            <div className="section-header">
              <h2>Activity Overview</h2>
              <div className="period-selector">
                <button
                  className={selectedPeriod === "week" ? "active" : ""}
                  onClick={() => setSelectedPeriod("week")}
                >
                  Week
                </button>
                <button
                  className={selectedPeriod === "month" ? "active" : ""}
                  onClick={() => setSelectedPeriod("month")}
                >
                  Month
                </button>
                <button
                  className={selectedPeriod === "year" ? "active" : ""}
                  onClick={() => setSelectedPeriod("year")}
                >
                  Year
                </button>
              </div>
            </div>
            <div className="chart-container">
              {activityData[selectedPeriod].map((data, index) => (
                <div key={index} className="bar-wrapper">
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        height: `${(data.reports / maxReports) * 100}%`,
                      }}
                    >
                      <span className="bar-value">{data.reports}</span>
                    </div>
                  </div>
                  <span className="bar-label">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications - NOW WITH REAL DATA */}
          <div className="notifications-section">
            <div className="section-header">
              <h2>Notifications</h2>
              {notifications.length > 0 && (
                <button
                  className="view-all-btn"
                  onClick={() => {
                    // You can create a full notifications page later
                    console.log("View all notifications");
                  }}
                >
                  View All
                </button>
              )}
            </div>
            <div className="notifications-list">
              {loadingNotifications ? (
                <div className="notification-loading">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <i className="fa-solid fa-bell-slash"></i>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`notification-item ${getNotificationType(
                      notification.priority
                    )} ${notification.is_read ? "read" : "unread"}`}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.notification_id);
                      }
                    }}
                    style={{
                      cursor: notification.is_read ? "default" : "pointer",
                    }}
                  >
                    <div className="notification-icon">
                      <i
                        className={`fa-solid ${getNotificationIcon(
                          notification.type,
                          notification.priority
                        )}`}
                      ></i>
                    </div>
                    <div className="notification-content">
                      <h4>
                        {notification.title}
                        {!notification.is_read && (
                          <span className="unread-dot"></span>
                        )}
                      </h4>
                      {notification.message && <p>{notification.message}</p>}
                      <div className="notification-footer-info">
                        <span className="notification-time">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                        {notification.company_name && (
                          <span className="notification-company">
                            • {notification.company_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Secondary Content Grid */}
        <div className="secondary-content-grid">
          {/* Nearby Centers Map */}
          <div className="nearby-centers-section">
            <div className="section-header">
              <h2>Nearby Centers</h2>
              <button
                className="view-map-btn"
                onClick={() => navigate("/client/map")}
              >
                <i className="fa-solid fa-map"></i> View Map
              </button>
            </div>
            <div className="map-placeholder">
              <i className="fa-solid fa-map-location-dot"></i>
              <p>Interactive map will load here</p>
            </div>
            <div className="centers-list">
              {nearbyCenters.map((center) => (
                <div key={center.id} className="center-item">
                  <div className="center-icon">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div className="center-info">
                    <h4>{center.name}</h4>
                    <p>
                      <span className="center-type">{center.type}</span>
                      <span className="center-distance">
                        • {center.distance}
                      </span>
                    </p>
                  </div>
                  <button className="directions-btn">
                    <i className="fa-solid fa-directions"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="schedule-section">
            <div className="section-header">
              <h2>Weekly Schedule</h2>
              <button className="add-event-btn">
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
            <div className="schedule-list">
              {weeklySchedule.map((item, index) => (
                <div key={index} className={`schedule-item ${item.status}`}>
                  <div className="schedule-day">
                    <span className="day-name">{item.day}</span>
                    <span className="day-time">{item.time}</span>
                  </div>
                  <div className="schedule-task">
                    <h4>{item.task}</h4>
                    <span className={`status-badge ${item.status}`}>
                      {item.status === "completed" ? (
                        <>
                          <i className="fa-solid fa-check"></i> Completed
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-clock"></i> Upcoming
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
