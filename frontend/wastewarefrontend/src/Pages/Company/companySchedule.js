import React, { useState, useEffect, useContext } from "react";
import Navbar from "../../Components/navbar.js";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import "../../Styles/Page/companySchedule.css";
import "../../Styles/Base/glass.css";
import { useFetchWithAuth } from "../../Components/fetchWithAuth";
import { AuthContext } from "../../Components/AuthProvider.js";
import AlertSnackbar from "../../Components/Alert.js";
import Modalwindow from "../../Components/Modal.js";
import ScheduleTable from "../../Components/ScheduleTable.js";

const CompanySchedule = () => {
  const navigate = useNavigate();
  const fetchWithAuth = useFetchWithAuth();

  const [snackbar, setsnackbar] = useState(false);

  const [formData, setFormData] = useState({
    pickup_date: "",
    start_time: "",
    end_time: "",
    status: "available",
    notes: "",
  });

  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [errors, setErrors] = useState({});
  const { accessToken, user_type, userData } = useContext(AuthContext);
  const [viewallmodal, setviewallmodal] = useState(false);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loadingAllSchedules, setLoadingAllSchedules] = useState(false);

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
    fetchSchedules();
  }, [selectedDate]);

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (user_type && user_type !== "company" && user_type !== "admin") {
      navigate(-1);
    }
  }, [navigate]);

  const fetchSchedules = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetchWithAuth(
        `https://wasteware-project-production.up.railway.app/api/company/schedules/?date=${dateStr}`
      );
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchAllSchedules = async () => {
    setLoadingAllSchedules(true);
    try {
      const response = await fetchWithAuth(
        "https://wasteware-project-production.up.railway.app/api/company/schedules/"
      );
      if (response.ok) {
        const data = await response.json();
        setAllSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching all schedules:", error);
    } finally {
      setLoadingAllSchedules(false);
    }
  };

  const modifyviewallmodal = (value) => {
    console.log("Modal view is:", value);
    setviewallmodal(value);
    if (value) {
      fetchAllSchedules();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const response = await fetchWithAuth(
        "https://wasteware-project-production.up.railway.app/api/company/schedules/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const newSchedule = await response.json();
        setsnackbar(true);
        setFormData({
          pickup_date: "",
          start_time: "",
          end_time: "",
          status: "available",
          notes: "",
        });
        fetchSchedules();
      } else {
        const errorData = await response.json();
        setErrors(errorData);
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Failed to create schedule");
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "P.M." : "A.M.";
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "inProgress":
        return "#8B5CF6";
      default:
        return "#F97316";
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "completed":
        return {
          background: "linear-gradient(135deg, #10B981, #059669)",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
        };
      case "inProgress":
        return {
          background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
        };
      default:
        return {
          background: "linear-gradient(135deg, #F97316, #EA580C)",
          boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
        };
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")}`;
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const closesnackbar = () => {
    setsnackbar(false);
  };

  return (
    <div className="schedule-container">
      <Navbar
        links={links}
        profileImage={
          userData?.avatar
            ? `https://wasteware-project-production.up.railway.app${userData.avatar}`
            : "https://ui-avatars.com/api/?name=Company&background=10B981&color=fff&size=150"
        }
        profilePath="/company/profile"
        homepath="/company"
      />

      <div className="schedule-header">
        <HeaderBox
          text="Company Schedule"
          gradientColors="--gradient-clean-blue"
        />
      </div>

      <div className="schedule-content">
        {/* Left Side - Create Schedule Form */}
        <div className="schedule-form-card">
          <div className="form-card-header">
            <i className="fas fa-calendar-plus"></i>
            <h3>Add New Schedule</h3>
          </div>

          <form onSubmit={handleSubmit} className="schedule-form">
            <div className="form-grid">
              {/* Collection Date */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-calendar"></i>
                  Collection Date *
                </label>
                <input
                  type="date"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className={`form-input ${errors.pickup_date ? "error" : ""}`}
                />
                {errors.pickup_date && (
                  <span className="error-text">{errors.pickup_date}</span>
                )}
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-info-circle"></i>
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className={`form-input ${errors.status ? "error" : ""}`}
                >
                  <option value="available">Available</option>
                  <option value="completed">Completed</option>
                  <option value="inProgress">In Progress</option>
                </select>
              </div>

              {/* Start Time */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-clock"></i>
                  Start Time *
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className={`form-input ${errors.start_time ? "error" : ""}`}
                />
                {errors.start_time && (
                  <span className="error-text">{errors.start_time}</span>
                )}
              </div>

              {/* End Time */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-clock"></i>
                  End Time *
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className={`form-input ${errors.end_time ? "error" : ""}`}
                />
                {errors.end_time && (
                  <span className="error-text">{errors.end_time}</span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group-full" style={{ width: "50%" }}>
              <label className="form-label">
                <i className="fas fa-note-sticky"></i>
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Add any additional notes..."
                className="form-textarea"
              />
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                <i className="fas fa-plus"></i>
                Create Schedule
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => modifyviewallmodal(true)}
              >
                <i className="fas fa-eye"></i>
                View All Schedules
              </button>
            </div>
          </form>
        </div>

        {/* Right Side - Daily Schedule View */}
        <div className="schedule-view-card">
          <div className="daily-schedule-header">
            <h2>
              <i className="fas fa-calendar-day"></i>
              Daily Schedule
            </h2>
          </div>

          {/* Date Navigation */}
          <div className="date-navigation">
            <button onClick={() => changeDate(-1)} className="date-nav-btn">
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="current-date">
              <i className="fas fa-calendar-alt"></i>
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <button onClick={() => changeDate(1)} className="date-nav-btn">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {/* Status Legend */}
          <div className="status-legend">
            <div className="legend-item">
              <div className="legend-dot available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot in-progress"></div>
              <span>In Progress</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot completed"></div>
              <span>Completed</span>
            </div>
          </div>

          {/* Current Time Display */}
          <div className="time-display">
            <div className="time-circle">
              <i className="fas fa-clock"></i>
              <div className="current-time">{getCurrentTime()}</div>
              <div className="greeting">{getGreeting()}</div>
            </div>
          </div>

          {/* Schedule Items */}
          <div className="schedule-list">
            {schedules.length === 0 ? (
              <div className="no-schedules">
                <i className="fas fa-calendar-xmark"></i>
                <p>No schedules for this date</p>
                <span>Create a new schedule to get started</span>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div key={schedule.schedule_id} className="schedule-item">
                  <div
                    className="schedule-time-badge"
                    style={getStatusBadgeStyle(schedule.status)}
                  >
                    <i className="fas fa-clock"></i>
                    {formatTime(schedule.start_time)}
                  </div>
                  <div className="schedule-info">
                    <div className="schedule-title">
                      {schedule.notes || "Collection Scheduled"}
                    </div>
                    <div className="schedule-duration">
                      <i className="fas fa-hourglass-half"></i>
                      {formatTime(schedule.start_time)} -{" "}
                      {formatTime(schedule.end_time)}
                    </div>
                  </div>
                  <div className="schedule-status">
                    <div
                      className="status-indicator"
                      style={{ background: getStatusColor(schedule.status) }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AlertSnackbar
        message="Schedule created successfully"
        open={snackbar}
        onClose={closesnackbar}
        autoHideDuration={4000}
        severity="success"
      />

      <Modalwindow
        open={viewallmodal}
        onClose={() => modifyviewallmodal(false)}
      >
        <div className="modal-content">
          <button
            onClick={() => modifyviewallmodal(false)}
            className="modal-close-btn"
          >
            <i className="fas fa-times"></i>
          </button>
          <h2 className="modal-title">
            <i className="fas fa-calendar-week"></i>
            All Schedules
          </h2>

          <div className="modal-body">
            {loadingAllSchedules ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading schedules...</p>
              </div>
            ) : (
              <ScheduleTable schedules={allSchedules} />
            )}
          </div>
        </div>
      </Modalwindow>
    </div>
  );
};

export default CompanySchedule;
