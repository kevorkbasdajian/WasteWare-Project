import React, { useState, useEffect } from "react";
import Navbar from "../../Components/navbar.js";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import "../../Styles/Page/companySchedule.css";
import "../../Styles/Base/glass.css";
import { useFetchWithAuth } from "../../Components/fetchWithAuth";

const CompanySchedule = () => {
  const navigate = useNavigate();
  const fetchWithAuth = useFetchWithAuth();

  const [formData, setFormData] = useState({
    pickup_date: "",
    start_time: "",
    end_time: "",
    status: "scheduled",
    notes: "",
  });

  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [errors, setErrors] = useState({});

  const links = [
    {
      name: "Home",
      path: "/company",
      color: "var(--gradient-red)",
      glowColor: "#EF4444", // Solid color for LED glow
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
      name: "Reports",
      path: "/company/reports",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-camera fa-lg",
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: "fa-solid fa-clock fa-lg",
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

  const fetchSchedules = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetchWithAuth(
        `http://localhost:8000/api/company/schedules/?date=${dateStr}`
      );
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
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
        "http://localhost:8000/api/company/schedules/",
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
        alert("Schedule created successfully!");
        setFormData({
          pickup_date: "",
          start_time: "",
          end_time: "",
          status: "scheduled",
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
        return "#10B981"; // green
      case "canceled":
        return "#EF4444"; // red
      case "inProgress":
        return "rgba(186, 17, 238, 1)";
      default:
        return "#F97316"; // orange for scheduled
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "Afternoon" : "Morning";
    return `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")}`;
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div
      style={{
        // background: "linear-gradient(135deg, #6fc276ff 0%, #40E0D0 100%)",
        // minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <Navbar links={links} />
      <div className="headerr">
        <HeaderBox
          text="Company Schedule"
          gradientColors={["#0288D1 30%", "#26C6DA 100%"]}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 20,
        }}
      >
        {/* Left Side - Create Schedule Form */}
        <div className="glass2 y">
          <div className="b1t1holders">
            <p className="b1t1s">Add a new Schedule</p>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Collection Date */}
            <div className="grids">
              <div>
                <label className="label">Collection Date *</label>
                <input
                  type="date"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleInputChange}
                  required
                  className="collectiondate"
                  style={{
                    border: errors.pickup_date
                      ? "2px solid #b00404ff"
                      : "#c791ee",
                  }}
                />
                {errors.pickup_date && (
                  <span style={{ color: "#b00404ff", fontSize: "1.0rem" }}>
                    {errors.pickup_date}
                  </span>
                )}
              </div>

              {/*Status*/}
              <div>
                <label className="label">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="collectiondate"
                  style={{
                    border: errors.status ? "2px solid #EF4444" : "#c791ee",
                    width: "100%",
                  }}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                  <option value="inProgress">In Progress</option>
                </select>
              </div>
              {/* Start Time */}
              <div>
                <label className="label">Start Time *</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="collectiondate"
                  style={{
                    border: errors.start_time ? "2px solid #EF4444" : "none",
                  }}
                />
                {errors.start_time && (
                  <span style={{ color: "#b00404ff", fontSize: "1.0 rem" }}>
                    {errors.start_time}
                  </span>
                )}
              </div>
              {/* End Time */}
              <div>
                <label className="label">End Time *</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className="collectiondate"
                  style={{
                    border: errors.end_time ? "2px solid #EF4444" : "none",
                  }}
                />
                {errors.end_time && (
                  <span style={{ color: "#b00404ff", fontSize: "1.0rem" }}>
                    {errors.end_time}
                  </span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div style={{ width: "80%", marginBlock: 30 }}>
              <label className="label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Add any additional notes..."
                className="textbox"
                style={{ minHeight: 120 }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="actualButton"
              style={{
                background: "linear-gradient(135deg, #c791ee, #A855F7)",
                fontSize: "25px",
                marginBottom: 20,
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              <i
                className="fa-solid fa-plus"
                style={{ marginRight: "0.5rem" }}
              />
              Create Schedule
            </button>
          </form>
        </div>

        {/* Right Side - Daily Schedule View */}
        <div style={{ flex: 0.8, marginTop: 20 }}>
          <div
            style={{
              background: "#0288D1",
              borderRadius: "12px",
              padding: "1.5rem",
              color: "white",
            }}
          >
            {/* Header */}
            <div className="head">
              <h2 className="h2">Daily Schedule</h2>
            </div>

            {/* Date Navigation */}
            <div className="datenav">
              <button onClick={() => changeDate(-1)} className="backbtn">
                <i className="fa-solid fa-chevron-left fa-2x" />
              </button>
              <span style={{ fontSize: "1.4rem", fontWeight: "500" }}>
                {selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <button onClick={() => changeDate(1)} className="backbtn">
                <i className="fa-solid fa-chevron-right fa-2x" />
              </button>
            </div>

            {/* Status Legend */}
            <div className="statusl">
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div className="comp" style={{ background: "#F97316" }} />
                <span style={{ fontSize: 16 }}>Scheduled</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  className="comp"
                  style={{ background: "rgba(186, 17, 238, 1)" }}
                />
                <span style={{ fontSize: 16 }}>In Progress</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div className="comp" />
                <span style={{ fontSize: 16 }}>Completed</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  className="comp"
                  style={{
                    background: "#EF4444",
                  }}
                />
                <span style={{ fontSize: 16 }}>Canceled</span>
              </div>
            </div>

            {/* Current Time Display */}
            <div className="time">
              <div style={{ fontSize: "2.5rem", fontWeight: "700" }}>
                {getCurrentTime()}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#6B7280" }}>
                {getGreeting()}
              </div>
            </div>

            {/* Schedule Items */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {schedules.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <i
                    className="fa-solid fa-calendar-xmark "
                    style={{ fontSize: "4rem", marginBottom: "0.5rem" }}
                  />
                  <p style={{ color: "rgba(255, 255, 255, 0.89)" }}>
                    No schedules for this date
                  </p>
                </div>
              ) : (
                schedules.map((schedule) => (
                  <div
                    key={schedule.schedule_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    {/* Time Badge */}
                    <div
                      style={{
                        background: getStatusColor(schedule.status),
                        color: "white",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px 0 0 8px",
                        fontWeight: "700",
                        fontSize: "1rem",
                        minWidth: "80px",
                        textAlign: "center",
                      }}
                    >
                      {formatTime(schedule.start_time)}
                    </div>
                    {/* Schedule Info */}
                    <div
                      style={{
                        flex: 1,
                        background: "white",
                        color: "#1F2937",
                        padding: "0.75rem 1rem",
                        borderRadius: "0 8px 8px 0",
                      }}
                    >
                      <div
                        style={{ fontWeight: "500", marginBottom: "0.25rem" }}
                      >
                        {schedule.notes || "Collection Scheduled"}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#6B7280" }}>
                        {formatTime(schedule.start_time)} -{" "}
                        {formatTime(schedule.end_time)}
                      </div>
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

export default CompanySchedule;
