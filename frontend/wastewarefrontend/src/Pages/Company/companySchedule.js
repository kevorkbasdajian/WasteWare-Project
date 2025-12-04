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
  const { accessToken, user_type } = useContext(AuthContext);
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
    fetchSchedules();
  }, [selectedDate]);

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate]);

  // useEffect(() => {
  //   if (user_type && user_type !== "company") {
  //     navigate(-1);
  //   }
  // }, [navigate]);

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

  const fetchAllSchedules = async () => {
    setLoadingAllSchedules(true);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/company/schedules/"
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
        // console.error("Schedule creation failed:", errorData); // Add this
        // alert(`Error: ${JSON.stringify(errorData)}`); // Add this to see the error
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
  const closesnackbar = () => {
    setsnackbar(false);
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
                  <span
                    style={{
                      color: " rgba(207, 43, 43, 1)",
                      fontSize: "1.0rem",
                      fontWeight: "bold",
                      backgroundColor: "#ffffffff",
                      borderRadius: 5,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 10,
                    }}
                  >
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
                  <option value="available">Available</option>
                  <option value="completed">Completed</option>
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
                  <span
                    style={{
                      color: " rgba(207, 43, 43, 1)",
                      fontSize: "1.0rem",
                      fontWeight: "bold",
                      backgroundColor: "#ffffffff",
                      borderRadius: 5,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 10,
                    }}
                  >
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
                  <span
                    style={{
                      color: " rgba(207, 43, 43, 1)",
                      fontSize: "1.0rem",
                      fontWeight: "bold",
                      backgroundColor: "#ffffffff",
                      borderRadius: 5,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 10,
                    }}
                  >
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
          <button
            type="button"
            className="actualButton"
            onClick={() => modifyviewallmodal(true)}
            style={{
              background: "linear-gradient(135deg, #60a5fa, #8b5cf6)",
              fontSize: "25px",
              marginBottom: 20,
            }}
            onMouseEnter={(e) =>
              (e.target.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
          >
            <i className="fa  fa-eye" style={{ marginRight: "0.5rem" }} />
            View All Schedules
          </button>
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
                <span style={{ fontSize: 16 }}>Available</span>
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
      <AlertSnackbar
        message="Schedule created successfully"
        open={snackbar}
        onClose={closesnackbar}
        autoHideDuration={4000}
      />
      <Modalwindow
        open={viewallmodal}
        onClose={() => modifyviewallmodal(false)}
      >
        <div
          className="modal"
          style={{ width: "95%", maxWidth: "1400px", overflowY: "scroll" }}
        >
          <div
            style={{
              right: 20,
              top: 30,
              position: "absolute",
              height: 50,
              width: 50,
            }}
          >
            <button
              onClick={() => modifyviewallmodal(false)}
              className="closebtn"
            >
              <i className="fa-solid fa-x fa-lg" />
            </button>
          </div>
          <p className="modaltitle">All Schedules</p>

          <div style={{ marginTop: "20px", padding: "20px" }}>
            {loadingAllSchedules ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                Loading schedules...
              </p>
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
