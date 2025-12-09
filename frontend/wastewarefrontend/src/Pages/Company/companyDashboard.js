import { useContext, useEffect, useState } from "react";
import "../../Styles/Page/companyDashboard.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";

const CompanyDashboard = () => {
  const { clearAuth, accessToken, isLoadingUser, user_type, userData } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalRoutes: 0,
      activeRoutes: 0,
      totalDrivers: 0,
      totalTrucks: 0,
      availableTrucks: 0,
      totalDumpings: 0,
      todayPickups: 0,
      upcomingSchedules: 0,
    },
    recentPickups: [],
    upcomingSchedules: [],
    activeRoutes: [],
    notifications: [],
    loading: true,
  });
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // chart data will be computed from API pickups
  const [chartData, setChartData] = useState({
    week: [],
    month: [],
    year: [],
  });

  useEffect(() => {
    if (user_type && user_type !== "company" && user_type !== "admin") {
      navigate(-1);
    }
  }, [navigate]);

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
      color: "var(--gradient-light-green)",
      glowColor: "var(--light-green)",
      icon: "fa-solid fa-map-location-dot fa-lg",
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: "fa-solid fa-calendar-days fa-lg",
    },
    {
      name: "Pickups",
      path: "/company/pickups",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: "fa-solid fa-truck-pickup fa-lg",
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
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  // ---------- Helpers to aggregate pickups ----------
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const formatDayShort = (d) =>
    d.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue...

  // build last 7 days buckets (including today), sorted oldest -> newest
  const buildWeekBuckets = (pickups) => {
    const buckets = [];
    const today = startOfDay(new Date());
    // create 7 dates: today -6 ... today
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      buckets.push({
        key: day.toISOString().slice(0, 10), // YYYY-MM-DD
        label: formatDayShort(day),
        pickups: 0,
        weight: 0,
      });
    }

    const bucketMap = Object.fromEntries(buckets.map((b) => [b.key, b]));

    pickups.forEach((p) => {
      const raw = p?.schedule?.pickup_date || p?.pickup_date || p?.date;
      if (!raw) return;
      const d = startOfDay(new Date(raw));
      const key = d.toISOString().slice(0, 10);
      if (bucketMap[key]) {
        bucketMap[key].pickups += 1;
        bucketMap[key].weight += Number(p.weight_collected || 0);
      }
    });

    return Object.values(bucketMap);
  };

  // build 4 week buckets for current month (week 1,2,3,4)
  const buildMonthBuckets = (pickups) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // get first and last day of month
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();

    // split month into 4 roughly equal groups: 1-7,8-14,15-21,22-end
    const ranges = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: daysInMonth },
    ];

    const buckets = ranges.map((r, idx) => ({
      key: `W${idx + 1}`,
      label: `Week ${idx + 1}`,
      startDate: new Date(year, month, r.start),
      endDate: new Date(year, month, r.end, 23, 59, 59, 999),
      pickups: 0,
      weight: 0,
    }));

    pickups.forEach((p) => {
      const raw = p?.schedule?.pickup_date || p?.pickup_date || p?.date;
      if (!raw) return;
      const d = new Date(raw);
      for (const b of buckets) {
        if (d >= b.startDate && d <= b.endDate) {
          b.pickups += 1;
          b.weight += Number(p.weight_collected || 0);
          break;
        }
      }
    });

    return buckets.map(({ key, label, pickups, weight }) => ({
      key,
      label,
      pickups,
      weight,
    }));
  };

  // build 12 month buckets for current year
  const buildYearBuckets = (pickups) => {
    const now = new Date();
    const year = now.getFullYear();
    const buckets = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(year, m, 1);
      buckets.push({
        key: String(m + 1).padStart(2, "0"),
        label: d.toLocaleDateString("en-US", { month: "short" }), // Jan
        month: m,
        pickups: 0,
        weight: 0,
      });
    }

    pickups.forEach((p) => {
      const raw = p?.schedule?.pickup_date || p?.pickup_date || p?.date;
      if (!raw) return;
      const d = new Date(raw);
      if (d.getFullYear() !== year) return;
      const m = d.getMonth();
      buckets[m].pickups += 1;
      buckets[m].weight += Number(p.weight_collected || 0);
    });

    return buckets.map(({ key, label, pickups, weight }) => ({
      key,
      label,
      pickups,
      weight,
    }));
  };

  const aggregatePickupsToChartData = (pickups) => {
    // ensure pickups is an array
    const arr = Array.isArray(pickups) ? pickups : [];
    return {
      week: buildWeekBuckets(arr),
      month: buildMonthBuckets(arr),
      year: buildYearBuckets(arr),
    };
  };
  // ---------- End helpers ----------

  // Fetch company notifications
  const fetchNotifications = async () => {
    if (!accessToken) {
      console.log("No access token available");
      return;
    }

    setLoadingNotifications(true);
    try {
      console.log("Fetching notifications...");
      // Try the direct endpoint first
      const response = await fetch(
        "https://wasteware-project-production.up.railway.app/api/auth/notifications/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Notifications received:", data);
        console.log("Number of notifications:", data?.length || 0);

        // The API returns an array directly
        const notificationsArray = Array.isArray(data) ? data : [];

        // Get only the 3 most recent
        setDashboardData((prev) => ({
          ...prev,
          notifications: notificationsArray.slice(0, 3),
        }));
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch notifications:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        setDashboardData((prev) => ({
          ...prev,
          notifications: [],
        }));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setDashboardData((prev) => ({
        ...prev,
        notifications: [],
      }));
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!accessToken) return;

      try {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        };

        // Fetch all required data
        const [routes, drivers, trucks, dumpings, pickups, schedules] =
          await Promise.all([
            fetch(
              "https://wasteware-project-production.up.railway.app/api/company/routes/",
              {
                headers,
              }
            ).then((r) => r.json()),
            fetch(
              "https://wasteware-project-production.up.railway.app/api/company/drivers/",
              {
                headers,
              }
            ).then((r) => r.json()),
            fetch(
              "https://wasteware-project-production.up.railway.app/api/company/trucks/",
              {
                headers,
              }
            ).then((r) => r.json()),
            fetch(
              "https://wasteware-project-production.up.railway.app/api/company/dumpings/",
              {
                headers,
              }
            ).then((r) => r.json()),
            fetch(
              "https://wasteware-project-production.up.railway.app/api/company/pickups/",
              {
                headers,
              }
            ).then((r) => r.json()),
            fetch(
              "https://wasteware-project-production.up.railway.app/api/company/schedules/?future_only=true",
              { headers }
            ).then((r) => r.json()),
          ]);

        // Calculate stats
        const activeRoutes = (routes || []).filter(
          (r) => r.status === "active"
        );
        const availableTrucks = (trucks || []).filter((t) => t.available);
        const todayPickups = (pickups || []).filter((p) => {
          const pickupDate = new Date(p.schedule?.pickup_date || p.pickup_date);
          const today = new Date();
          return pickupDate.toDateString() === today.toDateString();
        });

        // compute chart data from pickups
        const aggregated = aggregatePickupsToChartData(pickups || []);
        setChartData(aggregated);

        setDashboardData({
          stats: {
            totalRoutes: (routes || []).length,
            activeRoutes: activeRoutes.length,
            totalDrivers: (drivers || []).length,
            totalTrucks: (trucks || []).length,
            availableTrucks: availableTrucks.length,
            totalDumpings: (dumpings || []).length,
            todayPickups: todayPickups.length,
            upcomingSchedules: (schedules || []).length,
          },
          recentPickups: (pickups || []).slice(0, 5),
          upcomingSchedules: (schedules || []).slice(0, 5),
          activeRoutes: activeRoutes.slice(0, 5),
          notifications: [], // Will be filled by fetchNotifications
          loading: false,
        });

        // Fetch notifications separately
        fetchNotifications();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, [accessToken]);

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

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "alert":
        return "fa-exclamation-triangle";
      case "reward":
        return "fa-gift";
      case "report":
        return "fa-file-alt";
      case "system":
        return "fa-cog";
      default:
        return "fa-bell";
    }
  };

  const getNotificationType = (type) => {
    switch (type?.toLowerCase()) {
      case "alert":
        return "warning";
      case "reward":
        return "success";
      case "report":
        return "info";
      case "system":
        return "info";
      default:
        return "info";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "priority-high";
      case "normal":
        return "priority-normal";
      case "low":
        return "priority-low";
      default:
        return "priority-normal";
    }
  };
  if (isLoadingUser || dashboardData.loading) {
    return (
      <div className="loading">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // safe max computation
  const periodData = chartData[selectedPeriod] || [];
  const maxPickups =
    periodData.length > 0 ? Math.max(...periodData.map((d) => d.pickups)) : 1;

  return (
    <div className="page">
      <Navbar
        links={links}
        profilePath="/company/profile"
        profileImage={
          userData?.avatar
            ? `https://wasteware-project-production.up.railway.app${userData.avatar}`
            : "https://ui-avatars.com/api/?name=Company&background=10B981&color=fff&size=150"
        }
        homepath="/company"
      />

      <HeaderBox
        text={`Welcome Back, ${userData?.company_name || "Admin"}!`}
        gradientColors={"--gradient-red"}
      />

      <div className="company-dashboard-container">
        {/* Stats Overview */}
        <div className="company-stats-section">
          <h2>
            <i className="fa-solid fa-chart-line"></i>
            Operations Overview
          </h2>
          <div className="company-stats-grid">
            <div className="company-stat-card">
              <div className="stat-icon-large">
                <i className="fa-solid fa-route"></i>
              </div>
              <h3>{dashboardData.stats.activeRoutes}</h3>
              <p>Active Routes</p>
              <span className="stat-subtitle">
                of {dashboardData.stats.totalRoutes} total
              </span>
            </div>

            <div className="company-stat-card">
              <div className="stat-icon-large">
                <i className="fa-solid fa-truck"></i>
              </div>
              <h3>{dashboardData.stats.availableTrucks}</h3>
              <p>Available Trucks</p>
              <span className="stat-subtitle">
                of {dashboardData.stats.totalTrucks} total
              </span>
            </div>

            <div className="company-stat-card">
              <div className="stat-icon-large">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <h3>{dashboardData.stats.totalDrivers}</h3>
              <p>Active Drivers</p>
              <span className="stat-subtitle">on duty today</span>
            </div>

            <div className="company-stat-card">
              <div className="stat-icon-large">
                <i className="fa-solid fa-truck-pickup"></i>
              </div>
              <h3>{dashboardData.stats.todayPickups}</h3>
              <p>Today's Pickups</p>
              <span className="stat-subtitle">
                {dashboardData.stats.upcomingSchedules} scheduled
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="company-main-grid">
          {/* Pickups Chart */}
          <div className="company-chart-section">
            <div className="section-header">
              <h2>Pickup Statistics</h2>
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
              {periodData.map((data, index) => (
                <div key={index} className="bar-wrapper">
                  <div className="bar-container">
                    <div
                      className="bar pickups"
                      style={{
                        height: `${(data.pickups / maxPickups) * 100}%`,
                      }}
                      title={`${data.pickups} pickups • ${Math.round(
                        data.weight
                      )} kg`}
                    >
                      <span className="bar-value">{data.pickups}</span>
                    </div>
                  </div>
                  <span className="bar-label">{data.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Routes */}
          <div className="company-routes-section">
            <div className="section-header">
              <h2>Active Routes</h2>
              <button
                className="view-all-btn"
                onClick={() => navigate("/company/routes")}
              >
                View All
              </button>
            </div>
            <div className="routes-list">
              {dashboardData.activeRoutes.length > 0 ? (
                dashboardData.activeRoutes.map((route) => (
                  <div key={route.route_id} className="route-item">
                    <div className="route-icon">
                      <i className="fa-solid fa-route"></i>
                    </div>
                    <div className="route-info">
                      <h4>Route #{route.route_id}</h4>
                      <p>
                        <span className="route-driver">
                          {route.driver
                            ? `${route.driver.first_name} ${route.driver.last_name}`
                            : "No driver"}
                        </span>
                        <span className="route-waste">
                          • {route.waste_type?.name || "N/A"}
                        </span>
                      </p>
                    </div>
                    <span className="status-badge active">Active</span>
                  </div>
                ))
              ) : (
                <p className="empty-state">No active routes at the moment</p>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Grid */}
        <div className="company-secondary-grid">
          {/* Upcoming Schedules */}
          <div className="company-schedules-section">
            <div className="section-header">
              <h2>Upcoming Schedules</h2>
              <button
                className="add-btn"
                onClick={() => navigate("/company/schedule")}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
            <div className="schedules-list">
              {dashboardData.upcomingSchedules.length > 0 ? (
                dashboardData.upcomingSchedules.map((schedule) => (
                  <div key={schedule.schedule_id} className="schedule-item">
                    <div className="schedule-date">
                      <span className="date-day">
                        {new Date(schedule.pickup_date).getDate()}
                      </span>
                      <span className="date-month">
                        {new Date(schedule.pickup_date).toLocaleDateString(
                          "en-US",
                          { month: "short" }
                        )}
                      </span>
                    </div>
                    <div className="schedule-info">
                      <h4>Schedule #{schedule.schedule_id}</h4>
                      <p>
                        {schedule.start_time} - {schedule.end_time}
                      </p>
                    </div>
                    <span
                      className={`status-badge ${schedule.status.toLowerCase()}`}
                    >
                      {schedule.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty-state">No upcoming schedules</p>
              )}
            </div>
          </div>

          {/* Recent Pickups */}
          <div className="company-pickups-section">
            <div className="section-header">
              <h2>Recent Pickups</h2>
              <button
                className="view-all-btn"
                onClick={() => navigate("/company/pickups")}
              >
                View All
              </button>
            </div>
            <div className="pickups-list">
              {dashboardData.recentPickups.length > 0 ? (
                dashboardData.recentPickups.map((pickup) => (
                  <div key={pickup.pickup_id} className="pickup-item">
                    <div className="pickup-icon">
                      <i className="fa-solid fa-box"></i>
                    </div>
                    <div className="pickup-info">
                      <h4>Pickup #{pickup.pickup_id}</h4>
                      <p>
                        Route #{pickup.route.route_id} •{" "}
                        {pickup.weight_collected || 0} kg
                      </p>
                    </div>
                    <span
                      className={`status-badge ${pickup.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {pickup.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty-state">No recent pickups</p>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="company-notifications-section">
            <div className="section-header">
              <h2>Sent Notifications</h2>
              <button
                className="view-all-btn"
                onClick={() => navigate("/company/notifications")}
              >
                View All
              </button>
            </div>
            <div className="notifications-list">
              {loadingNotifications ? (
                <div className="notification-loading">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Loading notifications...</p>
                </div>
              ) : dashboardData.notifications.length > 0 ? (
                dashboardData.notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`notification-item ${getNotificationType(
                      notification.type
                    )} ${getPriorityClass(notification.priority)}`}
                  >
                    <div className="notification-icon">
                      <i
                        className={`fa-solid ${getNotificationIcon(
                          notification.type
                        )}`}
                      ></i>
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <h4>{notification.title}</h4>
                        {notification.priority === "high" && (
                          <span className="priority-badge high">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p>{notification.message || "No message"}</p>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                        {notification.user_name &&
                          !notification.is_broadcast && (
                            <span className="notification-recipient">
                              → {notification.user_name}
                            </span>
                          )}
                        {notification.target_audience === "all_users" && (
                          <span className="notification-audience">
                            <i className="fa-solid fa-users"></i>
                            {notification.recipient_count
                              ? `Sent to ${notification.recipient_count} users`
                              : "All Users"}
                          </span>
                        )}
                        {notification.target_audience === "custom" &&
                          notification.recipient_count && (
                            <span className="notification-audience">
                              <i className="fa-solid fa-user-group"></i>
                              {notification.recipient_count} recipient
                              {notification.recipient_count > 1 ? "s" : ""}
                            </span>
                          )}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="unread-indicator" title="Unread"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="notification-empty">
                  <i className="fa-solid fa-paper-plane"></i>
                  <p>No notifications sent yet</p>
                  <small>
                    Send notifications to your users from the Notifications page
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
