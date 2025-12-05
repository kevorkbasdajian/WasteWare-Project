import React, { useContext, useEffect, useState } from "react";
import "../../Styles/Page/clientMap.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import TimelineSchedule from "../../Components/TimelineSchedule.js";
import ClientRouteMap from "../../Components/ClientRouteMap.js";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";

const ClientMap = () => {
  const { clearAuth, accessToken, user_type, userData, isLoadingUser } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const fetchWithAuth = useFetchWithAuth();

  // State management
  const [pickups, setPickups] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Check authentication
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

  // Fetch pickups on mount and when date changes
  useEffect(() => {
    if (accessToken) {
      fetchPickups();
    }
  }, [accessToken, selectedDate]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      fetchPickups(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [accessToken, selectedDate]);

  const fetchPickups = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetchWithAuth(
        `http://localhost:8000/api/company/pickups/?date=${dateStr}`
      );

      if (response.ok) {
        const data = await response.json();
        setPickups(data);

        // If a pickup was selected, update it with fresh data
        if (selectedPickup) {
          const updatedPickup = data.find(
            (p) => p.pickup_id === selectedPickup.pickup_id
          );
          if (updatedPickup) {
            setSelectedPickup(updatedPickup);
          }
        } else if (data.length > 0) {
          // Auto-select first pickup if none selected
          setSelectedPickup(data[0]);
        }
      } else {
        throw new Error("Failed to fetch pickups");
      }
    } catch (err) {
      console.error("Error fetching pickups:", err);
      if (!silent) setError("Failed to load pickups. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setSelectedPickup(null); // Reset selection when date changes
  };

  const handleSelectPickup = (pickup) => {
    setSelectedPickup(pickup);
  };

  // Get waste type color
  const wasteTypeColors = {
    Chemical: "#10b981",
    Hazardous: "#ef4444",
    Organic: "#f59e0b",
    Industrial: "#8b5cf6",
    Liquid: "#3b82f6",
  };

  const getWasteTypeColor = () => {
    if (!selectedPickup?.route?.waste_type?.name) return "#94a3b8";
    return wasteTypeColors[selectedPickup.route.waste_type.name] || "#94a3b8";
  };

  // Loading state
  if (isLoadingUser || loading) {
    return (
      <div className="loading">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <p>Loading map...</p>
      </div>
    );
  }

  // Error state
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
        text="Live Pickup Tracking"
        gradientColors={"--gradient-clean-blue"}
      />

      <div className="client-map-container">
        {/* Error message */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Left Side - Timeline Schedule */}
        <div className="left-panel">
          <div className="schedule-header">
            <h2 className="schedule-title">
              <i className="fa-solid fa-calendar-days"></i>
              Daily Pickups
            </h2>

            {/* Date Navigation */}
            <div className="date-navigation">
              <button onClick={() => changeDate(-1)} className="date-nav-btn">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <span className="current-date">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <button onClick={() => changeDate(1)} className="date-nav-btn">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>

          {pickups.length === 0 ? (
            <div className="no-data">
              <i className="fa-solid fa-calendar-xmark fa-3x"></i>
              <p>No pickups scheduled for this date</p>
            </div>
          ) : (
            <TimelineSchedule
              pickups={pickups}
              selectedPickupId={selectedPickup?.pickup_id}
              onSelectPickup={handleSelectPickup}
              currentDate={selectedDate.toISOString().split("T")[0]}
            />
          )}
        </div>

        {/* Right Side - Map */}
        <div className="right-panel">
          {/* Map Header */}
          <div className="map-header">
            <div className="map-header-icon">
              <span>🗺️</span>
            </div>
            <div>
              <h2 className="map-title">Live Route Tracking</h2>
              <p className="map-subtitle">
                {selectedPickup
                  ? `Tracking Route #${selectedPickup.route.route_id}`
                  : "Select a pickup to view route"}
              </p>
            </div>
          </div>

          {/* Map Component */}
          <ClientRouteMap
            pickup={selectedPickup}
            wasteTypeColor={getWasteTypeColor()}
          />

          {/* Pickup Details Panel */}
          {selectedPickup && (
            <div className="pickup-details-panel">
              <h3 className="details-title">
                <i className="fa-solid fa-circle-info"></i>
                Pickup Details
              </h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Route</span>
                  <span className="detail-value">
                    #{selectedPickup.route.route_id}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Waste Type</span>
                  <span
                    className="detail-value"
                    style={{ color: getWasteTypeColor() }}
                  >
                    {selectedPickup.route.waste_type?.name || "N/A"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Driver</span>
                  <span className="detail-value">
                    {selectedPickup.route.driver?.first_name}{" "}
                    {selectedPickup.route.driver?.last_name}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Truck</span>
                  <span className="detail-value">
                    #{selectedPickup.route.truck?.truck_id || "N/A"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Schedule</span>
                  <span className="detail-value">
                    {selectedPickup.schedule.start_time} -{" "}
                    {selectedPickup.schedule.end_time}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span
                    className="status-badge-inline"
                    style={{
                      backgroundColor:
                        selectedPickup.status === "completed"
                          ? "#10B981"
                          : selectedPickup.status === "In Progress"
                          ? "#F59E0B"
                          : "#EF4444",
                    }}
                  >
                    {selectedPickup.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Weight Collected</span>
                  <span className="detail-value">
                    {selectedPickup.weight_collected || 0} kg
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Progress</span>
                  <span className="detail-value">
                    {selectedPickup.progress_percentage?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${selectedPickup.progress_percentage || 0}%`,
                    backgroundColor: getWasteTypeColor(),
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientMap;
