import React, { useContext, useEffect, useState } from "react";
import "../../Styles/Page/companyPickups.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import RouteMap from "../../Components/RouteMap.js";
import {
  Calendar,
  Search,
  Navigation,
  Package,
  Weight,
  ChevronDown,
  Check,
} from "lucide-react";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
const CompanyPickups = () => {
  //   const fetchWithAuth = useFetchWithAuth();
  const { clearAuth, accessToken } = useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchRoute, setSearchRoute] = useState("");
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  // const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
  const [creatingPickup, setCreatingPickup] = useState(false);
  const [currentPickup, setCurrentPickup] = useState(null);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [companyAddress, setCompanyAddress] = useState(null);

  const links = [
    {
      name: "Home",
      path: "/company",
      color: "var(--gradient-red)",
      glowColor: "#EF4444", // Solid color for LED glow
      icon: <i className="fa-solid fa-house fa-lg" />,
    },
    {
      name: "Routes",
      path: "/company/routes",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: <i className="fa-solid fa-map-location-dot fa-lg" />,
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: <i className="fa-solid fa-camera fa-lg" />,
    },
    {
      name: "Pickups",
      path: "/company/pickups",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: <i className="fa-solid fa-gift fa-lg" />,
    },
    {
      name: "Reports",
      path: "/company/reports",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: <i className="fa-solid fa-user fa-lg" />,
    },
    {
      name: "Profile",
      path: "/company/profile",
      color: "var(--gradient-green-blue)",
      glowColor: "#9d10b9ff",
      icon: <i className="fa-solid fa-user fa-lg" />,
    },
  ];

  useEffect(() => {
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate]);

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

  const wasteTypeColors = {
    Chemical: "#10b981",
    Hazardous: "#ef4444",
    Organic: "#f59e0b",
    Industrial: "#8b5cf6",
    Liquid: "#3b82f6",
  };

  useEffect(() => {
    const loadData = async () => {
      setLoadingRoutes(true);
      setLoadingSchedules(true);

      const [routesData, schedulesData, addressData] = await Promise.all([
        fetchRoutes(),
        fetchSchedules(),
        fetchCompanyAddress(),
      ]);

      setRoutes(routesData);
      setSchedules(schedulesData);
      setCompanyAddress(addressData);

      setLoadingRoutes(false);
      setLoadingSchedules(false);
    };

    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const fetchCompanyAddress = async () => {
    // Dummy company address - Beirut Central District
    return {
      latitude: 33.8938,
      longitude: 35.5018,
      street: "123 Central Street",
      city: "Beirut",
      region: "Beirut",
    };
  };
  // Add after all useState declarations
  const fetchRoutes = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/company/routes/"
      );
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
    return [];
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/company/schedules/?future_only=true&available=true"
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
    return [];
  };

  const filteredRoutes = routes.filter((route) => {
    const routeId = route.route_id ? route.route_id.toString() : "";
    const wasteName = route.waste_type?.name || "";
    const searchLower = searchRoute.toLowerCase();

    return (
      routeId.includes(searchLower) ||
      wasteName.toLowerCase().includes(searchLower)
    );
  });

  // const handleStartTracking = () => {
  //   if (selectedRoute && selectedSchedule) {
  //     setIsTracking(true);
  //     setProgress(0);
  //     setCollectedWeight(0);
  //   }
  // };

  // const handleStopTracking = () => {
  //   setIsTracking(false);
  // };

  // const handleResetTracking = () => {
  //   setProgress(0);
  //   setCollectedWeight(0);
  //   setCurrentLocation(null);
  //   setIsTracking(false);
  // };
  const handleCreatePickup = async () => {
    if (!selectedRoute || !selectedSchedule) {
      setError("Please select both a route and schedule");
      return;
    }

    setCreatingPickup(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/company/pickups/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route_id: selectedRoute.route_id,
            schedule_id: selectedSchedule.schedule_id,
            status: "Not Started",
          }),
        }
      );

      if (response.ok) {
        const pickup = await response.json();
        console.log("Pickup created:", pickup);
        setCurrentPickup(pickup);

        // Refresh routes to show updated status
        const updatedRoutes = await fetchRoutes();
        setRoutes(updatedRoutes);

        // Update selected route to show new status
        const updatedRoute = updatedRoutes.find(
          (r) => r.route_id === selectedRoute.route_id
        );
        if (updatedRoute) {
          setSelectedRoute(updatedRoute);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create pickup");
        console.error("Error creating pickup:", errorData);
      }
    } catch (error) {
      console.error("Error creating pickup:", error);
      setError("Failed to create pickup. Please try again.");
    } finally {
      setCreatingPickup(false);
    }
  };
  return (
    <div className="skeleton">
      <Navbar links={links} onLogout={handleLogout} />
      <HeaderBox
        text="Create Pickup & Track"
        gradientColors={["#F97316 30%", "#F59E0B 100%"]}
      />
      <div className="mainbody">
        {error && (
          <div
            style={{
              position: "absolute",
              padding: "1rem",
              backgroundColor: "#fee2e2",
              border: "1px solid #ef4444",
              borderRadius: "0.5rem",
              color: "#991b1b",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#991b1b",
                cursor: "pointer",
                fontSize: "1.25rem",
                fontWeight: "bold",
              }}
            >
              x
            </button>
          </div>
        )}
        {/* Left Panel - Route & Schedule Selection */}
        <div className="leftside">
          {/* Route Selection */}
          <div className="routecard" style={{ marginBottom: 30 }}>
            <div className="titleroute">
              <div className="iconroute">
                <Navigation
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    color: "#ffffff",
                  }}
                />
              </div>
              <h2 className="title-text">Select Route</h2>
            </div>

            {/* Search */}
            <div className="search">
              <Search className="iconsearch" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchRoute}
                onChange={(e) => setSearchRoute(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Route Dropdown */}
            <div className="routedropdown">
              <button
                onClick={() => setShowRouteDropdown(!showRouteDropdown)}
                className="routedropdownbutton"
              >
                <span
                  style={{ color: "#374151", fontSize: 15, fontWeight: 600 }}
                >
                  {selectedRoute
                    ? `Route #${selectedRoute.route_id} - ${
                        selectedRoute.waste_type?.name || "Unknown"
                      }`
                    : "Choose a route"}
                </span>
                <ChevronDown
                  className={`routechevron ${
                    showRouteDropdown ? "rotated" : ""
                  }`}
                />
              </button>

              {showRouteDropdown && (
                <div className="optionroute">
                  {loadingRoutes ? (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      Loading routes...
                    </div>
                  ) : filteredRoutes.length === 0 ? (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      No routes available
                    </div>
                  ) : (
                    filteredRoutes.map((route, index) => (
                      <button
                        key={route.route_id}
                        onClick={() => {
                          setSelectedRoute(route);
                          setShowRouteDropdown(false);
                        }}
                        className="optionbutton"
                      >
                        <div className="optbtnconchild">
                          <div
                            style={{
                              backgroundColor:
                                wasteTypeColors[route.waste_type?.name] ||
                                "#94a3b8",
                              borderRadius: "90px",
                            }}
                          />

                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#1f2937",
                                marginBottom: 10,
                                width: "100%",
                                fontSize: 16,
                              }}
                            >
                              Route #{route.route_id} -{" "}
                              {route.waste_type?.name || "Unknown"}
                            </div>

                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "#6b7280",
                                width: "100%",
                              }}
                            >
                              {route.waste_type?.name || "N/A"} •{" "}
                              {route.truck?.truck_id || "No truck"}
                            </div>
                          </div>

                          {selectedRoute?.route_id === route.route_id && (
                            <Check
                              style={{
                                width: "1.5rem",
                                height: "1.5rem",
                                color: "#2563eb",
                                position: "absolute",
                                right: 10,
                              }}
                            />
                          )}
                        </div>

                        {index !== routes.length - 1 && (
                          <hr style={{ marginBottom: -10 }} />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Route Details */}
            {selectedRoute && (
              <div className="detailscon">
                <div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#4b5563" }}>Driver:</span>
                    <span style={{ fontWeight: 600, color: "#1f2937" }}>
                      {selectedRoute.driver?.first_name}{" "}
                      {selectedRoute.driver?.last_name}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#4b5563" }}>Truck:</span>
                    <span style={{ fontWeight: 600, color: "#1f2937" }}>
                      {selectedRoute.truck?.truck_id || "N/A"}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#4b5563" }}>Stops:</span>
                    <span style={{ fontWeight: 600, color: "#1f2937" }}>
                      {selectedRoute.route_stops?.length || 0} locations
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#4b5563" }}>Status:</span>
                    <span
                      style={{
                        paddingLeft: "0.5rem",
                        paddingRight: "0.5rem",
                        paddingBlock: "0.25rem",
                        backgroundColor:
                          selectedRoute.status === "active"
                            ? "#22c55e"
                            : "#f59e0b",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        borderRadius: 999,
                      }}
                    >
                      {selectedRoute.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="routecard">
            <div className="titleroute">
              <div className="iconroute">
                <Calendar
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    color: "#ffffff",
                  }}
                />
              </div>
              <h2 className="title-text">Select Schedule</h2>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                width: "100%",
              }}
            >
              {loadingSchedules ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Loading schedules...
                </div>
              ) : schedules.length === 0 ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No available schedules
                </div>
              ) : (
                schedules.map((schedule) => {
                  const isSelected =
                    selectedSchedule?.schedule_id === schedule.schedule_id;

                  return (
                    <button
                      key={schedule.schedule_id}
                      onClick={() => {
                        setSelectedSchedule(schedule);
                      }}
                      className="schedulebutton"
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow =
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow =
                            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      {/* ALL your schedule button content stays exactly the same here */}

                      {/* Left colored accent bar */}
                      <div className="bar" />

                      {/* Main content container */}
                      <div
                        style={{ padding: "1.25rem", paddingLeft: "1.5rem" }}
                      >
                        {/* Header with date and checkmark */}
                        <div className="schedulecon">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            {/* Calendar icon */}
                            <div
                              style={{
                                backgroundColor: isSelected
                                  ? "#7c3aed"
                                  : "#e5e7eb",
                              }}
                              className="calendaricon"
                            >
                              <span style={{ fontSize: "1.25rem" }}>📅</span>
                            </div>

                            {/* Date */}
                            <div style={{ textAlign: "left" }}>
                              <div className="datee">Collection Date</div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: isSelected ? "#7c3aed" : "#1f2937",
                                  fontSize: "1.125rem",
                                  transition: "color 0.3s ease",
                                }}
                              >
                                {schedule.pickup_date}
                              </div>
                            </div>
                          </div>

                          {/* Checkmark indicator */}
                          {isSelected && (
                            <div className="checkmark">
                              <Check
                                style={{
                                  width: "1rem",
                                  height: "1rem",
                                  color: "#ffffff",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Time section */}
                        {/* ... rest of your code exactly the same ... */}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {selectedRoute && selectedSchedule && (
            <button
              onClick={handleCreatePickup}
              disabled={creatingPickup}
              className="createpickup"
              style={{
                cursor: creatingPickup ? "not-allowed" : "pointer",
                opacity: creatingPickup ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!creatingPickup) {
                  e.currentTarget.style.backgroundColor = "#F97316";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 20px rgba(16, 185, 129, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!creatingPickup) {
                  e.currentTarget.style.backgroundColor = "#F97316";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {creatingPickup ? (
                <>
                  <div
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      border: "3px solid #ffffff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Creating Pickup...
                </>
              ) : (
                <>
                  <Package style={{ width: "1.5rem", height: "1.5rem" }} />
                  Create Pickup & Start Tracking
                </>
              )}
            </button>
          )}
        </div>
        {/* Right Panel - Map & Details */}
        <div className="rightside">
          {selectedRoute && selectedRoute.route_stops && (
            <div className="dumping-panel">
              <h3 className="dumping-title">
                <Package className="icon-blue" />
                Dumping Locations ({selectedRoute.route_stops.length})
              </h3>

              <div className="dumping-grid">
                {selectedRoute.route_stops.map((stop, idx) => {
                  const dump = stop.dumping;
                  const isCompleted = stop.has_passed;

                  const dumpClass = isCompleted
                    ? "dump-card completed"
                    : "dump-card";

                  return (
                    <div key={dump.dumping_id} className={dumpClass}>
                      <div className="dump-card-inner">
                        <div className="dump-info">
                          <div
                            className={
                              isCompleted
                                ? "dump-index completed"
                                : "dump-index"
                            }
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div className="dump-name">{dump.Title}</div>
                            <div className="dump-coords">
                              {dump.address_detail?.latitude
                                ? typeof dump.address_detail.latitude ===
                                  "number"
                                  ? dump.address_detail.latitude.toFixed(4)
                                  : parseFloat(
                                      dump.address_detail.latitude
                                    ).toFixed(4)
                                : "N/A"}
                              ,{" "}
                              {dump.address_detail?.longitude
                                ? typeof dump.address_detail.longitude ===
                                  "number"
                                  ? dump.address_detail.longitude.toFixed(4)
                                  : parseFloat(
                                      dump.address_detail.longitude
                                    ).toFixed(4)
                                : "N/A"}
                            </div>
                            {isCompleted && (
                              <div className="dump-weight">
                                <Weight className="weight-icon" />
                                <span>{dump.collected_waste || 0} kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedRoute && (
            <div style={{ marginTop: "2rem" }}>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  padding: "1.5rem",
                  borderRadius: "1rem 1rem 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>🗺️</span>
                </div>
                <div>
                  <h2
                    style={{
                      color: "white",
                      margin: 0,
                      fontSize: "1.5rem",
                      fontWeight: 700,
                    }}
                  >
                    Interactive Route Map
                  </h2>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      margin: 0,
                      fontSize: "0.875rem",
                    }}
                  >
                    View and customize your collection route
                  </p>
                </div>
              </div>

              <RouteMap
                route={selectedRoute}
                companyAddress={companyAddress}
                wasteTypeColor={
                  wasteTypeColors[selectedRoute.waste_type?.name] || "#94a3b8"
                }
              />
            </div>
          )}
          {/* Map Container */}
          {/* <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Live Route Map</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMapView("satellite")}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    mapView === "satellite"
                      ? "bg-white text-gray-800"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  Satellite
                </button>
                <button
                  onClick={() => setMapView("street")}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    mapView === "street"
                      ? "bg-white text-gray-800"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  Street
                </button>
              </div>
            </div>

            <div className="relative h-[500px] bg-gradient-to-br from-slate-100 to-slate-200">
              {selectedRoute ? (
                <svg className="w-full h-full">
                  {selectedRoute.dumpings.map((dump, idx) => {
                    if (idx === selectedRoute.dumpings.length - 1) return null;
                    const nextDump = selectedRoute.dumpings[idx + 1];

                    const x1 = (dump.lng - 35.48) * 10000 + 100;
                    const y1 = (33.9 - dump.lat) * 10000 + 50;
                    const x2 = (nextDump.lng - 35.48) * 10000 + 100;
                    const y2 = (33.9 - nextDump.lat) * 10000 + 50;

                    const isCompleted =
                      (progress / 100) * selectedRoute.dumpings.length >
                      idx + 1;

                    return (
                      <g key={`path-${idx}`}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#94a3b8"
                          strokeWidth="12"
                          strokeLinecap="round"
                        />
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={
                            isCompleted ? getCompletedColor() : getRouteColor()
                          }
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={isCompleted ? "0" : "10,5"}
                          className="transition-all duration-500"
                        />
                      </g>
                    );
                  })}

                  {selectedRoute.dumpings.map((dump, idx) => {
                    const x = (dump.lng - 35.48) * 10000 + 100;
                    const y = (33.9 - dump.lat) * 10000 + 50;
                    const isCompleted =
                      (progress / 100) * selectedRoute.dumpings.length > idx;

                    return (
                      <g key={`dump-${dump.id}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r="20"
                          fill={isCompleted ? getCompletedColor() : "white"}
                          stroke={getRouteColor()}
                          strokeWidth="3"
                          className="transition-all duration-500"
                        />
                        <text
                          x={x}
                          y={y + 5}
                          textAnchor="middle"
                          fill={isCompleted ? "white" : getRouteColor()}
                          className="font-bold text-sm"
                        >
                          {idx + 1}
                        </text>
                      </g>
                    );
                  })}

                  {isTracking && currentLocation && (
                    <g>
                      <circle
                        cx={(currentLocation.lng - 35.48) * 10000 + 100}
                        cy={(33.9 - currentLocation.lat) * 10000 + 50}
                        r="25"
                        fill="#3b82f6"
                        className="animate-pulse"
                      />
                      <text
                        x={(currentLocation.lng - 35.48) * 10000 + 100}
                        y={(33.9 - currentLocation.lat) * 10000 + 55}
                        textAnchor="middle"
                        fill="white"
                        className="font-bold"
                        fontSize="20"
                      >
                        🚛
                      </text>
                    </g>
                  )}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      Select a route to view map
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default CompanyPickups;
