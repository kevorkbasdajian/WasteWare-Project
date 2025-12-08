import React, { useContext, useEffect, useState } from "react";
import "../../Styles/Page/clientDashboard.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider.js";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
import NearbyCentersMap from "../../Components/nearbyCenters.js";

const Dashboard = () => {
  const { clearAuth, accessToken, user_type, userData, isLoadingUser } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const fetchWithAuth = useFetchWithAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // Real notifications from backend
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Real activity data from backend
  const [activityData, setActivityData] = useState({
    week: [],
    month: [],
    year: [],
  });
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Real schedule data from backend
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Real nearby centers from backend
  const [nearbyCenters, setNearbyCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

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

  // ALL HOOKS MUST COME BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (user_type && user_type !== "user" && user_type !== "admin") {
      navigate(-1);
    }
  }, [user_type, navigate]);

  // Request live location on component mount (one-time)
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation not available in this browser");
      setLocationLoading(false);
      return;
    }

    const geoSuccess = (pos) => {
      const { latitude, longitude } = pos.coords;
      setLiveLocation([latitude, longitude]);
      setLocationLoading(false);
    };

    const geoError = (err) => {
      console.warn("Geolocation error:", err);
      if (err.code === err.PERMISSION_DENIED) {
        setLocationPermissionDenied(true);
      }
      setLiveLocation(null);
      setLocationLoading(false);
    };

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/auth/notifications/"
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchActivityData = async () => {
    setLoadingActivity(true);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/reports/"
      );

      if (response.ok) {
        const reports = await response.json();
        const processedData = processReportsData(reports);
        setActivityData(processedData);
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
      setActivityData({
        week: generateEmptyWeekData(),
        month: generateEmptyMonthData(),
        year: generateEmptyYearData(),
      });
    } finally {
      setLoadingActivity(false);
    }
  };

  // Fetch all data when component mounts
  useEffect(() => {
    if (accessToken && user_type === "user") {
      fetchNotifications();
      fetchWeeklySchedule();
    }
  }, [accessToken, user_type]);

  // Fetch nearby centers only when live location is available
  useEffect(() => {
    if (accessToken && user_type === "user" && liveLocation) {
      fetchNearbyCenters();
    }
  }, [accessToken, user_type, liveLocation]);

  // Process activity data from userData whenever it changes
  useEffect(() => {
    if (userData?.report_history) {
      const processedData = processReportsData(userData.report_history);
      setActivityData(processedData);
      setLoadingActivity(false);
    } else if (userData) {
      // No report history, set empty data
      setActivityData({
        week: generateEmptyWeekData(),
        month: generateEmptyMonthData(),
        year: generateEmptyYearData(),
      });
      setLoadingActivity(false);
    }
  }, [userData]);

  const fetchWeeklySchedule = async () => {
    setLoadingSchedule(true);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/company/pickups/?active_only=true"
      );

      if (response.ok) {
        const pickups = await response.json();
        const processedSchedule = processScheduleData(pickups);
        setWeeklySchedule(processedSchedule);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setWeeklySchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchNearbyCenters = async () => {
    // Don't fetch if no live location
    if (!liveLocation || liveLocation.length !== 2) {
      setNearbyCenters([]);
      setLoadingCenters(false);
      return;
    }

    setLoadingCenters(true);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/company/dumpings/"
      );

      if (!response.ok) {
        console.error("Nearby centers response not OK", response.status);
        setNearbyCenters([]);
        return;
      }

      const dumpings = await response.json();

      // Use only live location
      const userLat = Number(liveLocation[0]);
      const userLon = Number(liveLocation[1]);

      const centersWithDistance = dumpings
        .filter(
          (dumping) =>
            dumping.address_detail?.latitude &&
            dumping.address_detail?.longitude
        )
        .map((dumping) => {
          const dumpingLat = parseFloat(
            String(dumping.address_detail.latitude).replace(",", ".")
          );
          const dumpingLon = parseFloat(
            String(dumping.address_detail.longitude).replace(",", ".")
          );

          if (Number.isNaN(dumpingLat) || Number.isNaN(dumpingLon)) {
            console.warn(
              "Invalid dumping coords for id:",
              dumping.dumping_id,
              dumping.address_detail
            );
            return null;
          }

          const distance = calculateDistance(
            userLat,
            userLon,
            dumpingLat,
            dumpingLon
          );

          return {
            id: dumping.dumping_id,
            name: dumping.Title,
            distance: `${distance.toFixed(1)} km`,
            distanceValue: distance,
            type: dumping.waste_type?.name || "Waste Collection",
            address: formatAddress(dumping.address_detail),
            capacity: dumping.maximum_capacity,
            collected: dumping.collected_waste,
            latitude: dumpingLat,
            longitude: dumpingLon,
          };
        })
        .filter((center) => center !== null && center.distanceValue <= 10)
        .sort((a, b) => a.distanceValue - b.distanceValue);

      setNearbyCenters(centersWithDistance);
    } catch (error) {
      console.error("Error fetching nearby centers:", error);
      setNearbyCenters([]);
    } finally {
      setLoadingCenters(false);
    }
  };

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value) => {
    return (value * Math.PI) / 180;
  };

  const formatAddress = (address) => {
    if (!address) return "Address not available";
    const parts = [address.street, address.city, address.region].filter(
      Boolean
    );
    return parts.join(", ");
  };

  const handleGetDirections = (center) => {
    if (center.latitude && center.longitude) {
      // Open Google Maps with directions
      const url = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;
      window.open(url, "_blank");
    }
  };

  const handleSelectCenter = (center) => {
    setSelectedCenter(center);
  };

  const processScheduleData = (pickups) => {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = new Date();
    const scheduleMap = new Map();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = daysOfWeek[date.getDay()];
      const dateStr = date.toISOString().split("T")[0];
      scheduleMap.set(dateStr, { day: dayName, items: [] });
    }

    pickups.forEach((pickup) => {
      const pickupDate = pickup.schedule.pickup_date;

      if (scheduleMap.has(pickupDate)) {
        const schedule = scheduleMap.get(pickupDate);
        schedule.items.push({
          task: getTaskName(pickup),
          time: formatTime(pickup.schedule.start_time),
          status: getScheduleStatus(pickup),
          wasteType: pickup.route.waste_type?.name || "Waste Collection",
          pickup_id: pickup.pickup_id,
        });
      }
    });

    const scheduleArray = [];
    scheduleMap.forEach((value, key) => {
      if (value.items.length > 0) {
        value.items.forEach((item) => {
          scheduleArray.push({
            day: value.day,
            task: item.task,
            time: item.time,
            status: item.status,
            wasteType: item.wasteType,
            pickup_id: item.pickup_id,
          });
        });
      }
    });

    return scheduleArray.slice(0, 4);
  };

  const getTaskName = (pickup) => {
    const wasteType = pickup.route.waste_type?.name || "Waste";
    return `${wasteType} Collection`;
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getScheduleStatus = (pickup) => {
    const now = new Date();
    const scheduleDate = new Date(pickup.schedule.pickup_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    if (pickup.status === "completed") {
      return "completed";
    }

    if (pickup.status === "In Progress") {
      return "in-progress";
    }

    if (scheduleDate < today) {
      return "missed";
    }

    return "upcoming";
  };

  const processReportsData = (reportHistory) => {
    const now = new Date();
    const weekData = generateEmptyWeekData();
    const monthData = generateEmptyMonthData();
    const yearData = generateEmptyYearData();

    // reportHistory is an array of {date: "YYYY-MM-DD", count: number}
    reportHistory.forEach((report) => {
      const reportDate = new Date(report.date);
      const daysDiff = Math.floor((now - reportDate) / (1000 * 60 * 60 * 24));

      // Add to week data (last 7 days)
      if (daysDiff >= 0 && daysDiff < 7) {
        const dayIndex = (7 - daysDiff - 1 + now.getDay()) % 7;
        if (weekData[dayIndex]) {
          weekData[dayIndex].reports += report.count;
        }
      }

      // Add to month data (last 4 weeks)
      if (daysDiff >= 0 && daysDiff < 28) {
        const weekIndex = Math.floor(daysDiff / 7);
        if (monthData[weekIndex]) {
          monthData[weekIndex].reports += report.count;
        }
      }

      // Add to year data (last 6 months)
      const monthsDiff =
        (now.getFullYear() - reportDate.getFullYear()) * 12 +
        (now.getMonth() - reportDate.getMonth());
      if (monthsDiff >= 0 && monthsDiff < 6) {
        const monthIndex = 5 - monthsDiff;
        if (yearData[monthIndex]) {
          yearData[monthIndex].reports += report.count;
        }
      }
    });

    return { week: weekData, month: monthData, year: yearData };
  };

  const generateEmptyWeekData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date().getDay();
    const weekData = [];

    for (let i = 0; i < 7; i++) {
      const dayIndex = (today - 6 + i + 7) % 7;
      weekData.push({ day: days[dayIndex], reports: 0 });
    }

    return weekData;
  };

  const generateEmptyMonthData = () => {
    return [
      { day: "Week 1", reports: 0 },
      { day: "Week 2", reports: 0 },
      { day: "Week 3", reports: 0 },
      { day: "Week 4", reports: 0 },
    ];
  };

  const generateEmptyYearData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();
    const yearData = [];

    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      yearData.push({ day: months[monthIndex], reports: 0 });
    }

    return yearData;
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
        { method: "PATCH" }
      );
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "fa-check";
      case "in-progress":
        return "fa-spinner fa-spin";
      case "missed":
        return "fa-exclamation-triangle";
      default:
        return "fa-clock";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "missed":
        return "Missed";
      default:
        return "Upcoming";
    }
  };

  const maxReports = Math.max(
    ...activityData[selectedPeriod].map((d) => d.reports),
    1
  );

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
        profileImage={
          userData?.avatar
            ? `http://localhost:8000${userData.avatar}`
            : "https://ui-avatars.com/api/?name=User&background=random"
        }
      />

      <HeaderBox
        text={`Welcome Back, ${userData.name}!`}
        gradientColors={"--gradient-red"}
      />

      <div className="dashboard-container">
        <div className="impact-section stats-section">
          <h2>Your Statistics Overview</h2>
          <div className="stats-grid">
            <div className="stat-card impact-style">
              <div className="stat-icon-large">
                <i className="fa-solid fa-chart-simple"></i>
              </div>
              <h3>{userData.stats?.reports_submitted || 0}</h3>
              <p>Reports Submitted</p>
            </div>

            <div className="stat-card impact-style">
              <div className="stat-icon-large">
                <i className="fa-solid fa-leaf"></i>
              </div>
              <h3>{userData.stats?.eco_points || 0}</h3>
              <p>EcoPoints</p>
            </div>

            <div className="stat-card impact-style">
              <div className="stat-icon-large">
                <i className="fa-solid fa-earth-americas"></i>
              </div>
              <h3>{userData.stats?.co2_reduced || 0}</h3>
              <p>Tons CO2 Reduced</p>
            </div>

            <div className="stat-card impact-style">
              <div className="stat-icon-large">
                <i className="fa-solid fa-calendar-days"></i>
              </div>
              <h3>{userData.stats?.days_active || 0}</h3>
              <p>Days Active</p>
            </div>
          </div>
        </div>

        <div className="main-content-grid">
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

            {loadingActivity ? (
              <div className="chart-loading">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading activity data...</p>
              </div>
            ) : (
              <div className="chart-container">
                {activityData[selectedPeriod].length === 0 ? (
                  <div className="chart-empty">
                    <i className="fa-solid fa-chart-simple"></i>
                    <p>No activity data available</p>
                  </div>
                ) : (
                  activityData[selectedPeriod].map((data, index) => (
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
                  ))
                )}
              </div>
            )}
          </div>

          <div className="notifications-section">
            <div className="section-header">
              <h2>Notifications</h2>
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

        <div className="secondary-content-grid">
          {/* Nearby Centers - only show if live location available */}
          {liveLocation && liveLocation.length === 2 ? (
            <div className="nearby-centers-section">
              <div className="section-header">
                <h2>Nearby Centers (Within 10km)</h2>
                <div className="user-location-info">
                  <i className="fa-solid fa-location-dot"></i>
                  <strong>Your Live Location:</strong>{" "}
                  {liveLocation[0].toFixed(5)}, {liveLocation[1].toFixed(5)}
                </div>
                <button
                  className="view-map-btn"
                  onClick={() => navigate("/client/map")}
                >
                  <i className="fa-solid fa-map"></i> Full Map
                </button>
              </div>

              {loadingCenters ? (
                <div className="centers-loading">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Loading nearby centers...</p>
                </div>
              ) : nearbyCenters.length > 0 ? (
                <>
                  <div className="map-container">
                    <NearbyCentersMap
                      centers={nearbyCenters}
                      userLocation={liveLocation}
                      onCenterSelect={handleSelectCenter}
                      selectedCenter={selectedCenter}
                    />
                  </div>

                  <div className="centers-list">
                    {nearbyCenters.map((center) => (
                      <div
                        key={center.id}
                        className={`center-item ${
                          selectedCenter?.id === center.id ? "selected" : ""
                        }`}
                        onClick={() => handleSelectCenter(center)}
                      >
                        <div className="center-icon">
                          <i className="fa-solid fa-location-dot"></i>
                        </div>
                        <div className="center-info">
                          <h4>{center.name}</h4>
                          <p className="center-address">{center.address}</p>
                          <p>
                            <span className="center-type">{center.type}</span>
                            <span className="center-distance">
                              • {center.distance}
                            </span>
                          </p>
                          {center.capacity && (
                            <div className="capacity-bar">
                              <div
                                className="capacity-fill"
                                style={{
                                  width: `${
                                    (center.collected / center.capacity) * 100
                                  }%`,
                                }}
                              />
                              <span className="capacity-text">
                                {center.collected}/{center.capacity} tons
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          className="directions-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDirections(center);
                          }}
                          title="Get Directions"
                        >
                          <i className="fa-solid fa-directions"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="centers-empty">
                  <i className="fa-solid fa-map-location-dot"></i>
                  <p>No waste centers found within 10km of your location</p>
                  <button
                    className="view-all-centers-btn"
                    onClick={() => navigate("/client/map")}
                  >
                    View All Centers
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nearby-centers-section">
              <div className="section-header">
                <h2>Nearby Centers</h2>
              </div>
              <div className="centers-empty">
                <i className="fa-solid fa-location-crosshairs"></i>
                <p>
                  {locationLoading
                    ? "Getting your location..."
                    : locationPermissionDenied
                    ? "Location permission denied. Please enable location access in your browser settings to see nearby centers."
                    : "Please allow location access to see nearby waste centers"}
                </p>
                {!locationLoading && (
                  <button
                    className="view-all-centers-btn"
                    onClick={() => navigate("/client/map")}
                  >
                    View All Centers on Map
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="schedule-section">
            <div className="section-header">
              <h2>Upcoming Pickups</h2>
              {weeklySchedule.length > 0 && (
                <button
                  className="add-event-btn"
                  onClick={() => navigate("/client/map")}
                >
                  <i className="fa-solid fa-calendar"></i>
                </button>
              )}
            </div>
            <div className="schedule-list">
              {loadingSchedule ? (
                <div className="schedule-loading">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Loading schedule...</p>
                </div>
              ) : weeklySchedule.length === 0 ? (
                <div className="schedule-empty">
                  <i className="fa-solid fa-calendar-xmark"></i>
                  <p>No upcoming pickups scheduled</p>
                </div>
              ) : (
                weeklySchedule.map((item, index) => (
                  <div key={index} className={`schedule-item ${item.status}`}>
                    <div className="schedule-day">
                      <span className="day-name">{item.day}</span>
                      <span className="day-time">{item.time}</span>
                    </div>
                    <div className="schedule-task">
                      <h4>{item.task}</h4>
                      <span className={`status-badge ${item.status}`}>
                        <i
                          className={`fa-solid ${getStatusIcon(item.status)}`}
                        ></i>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
