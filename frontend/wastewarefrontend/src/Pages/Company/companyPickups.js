import React, { useContext, useEffect, useState } from "react";
import "../../Styles/Page/companyPickups.css";
import Navbar from "../../Components/navbar.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import RouteMap from "../../Components/RouteMap.js";
import Lottie from "lottie-react";

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
import truck from "../../Content/truck.json";
import time from "../../Content/Time.json";
import { RightPopupModal } from "../../Components/RightModal.js";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import AlertSnackbar from "../../Components/Alert.js";

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
const CompanyPickups = () => {
  //   const fetchWithAuth = useFetchWithAuth();
  const { clearAuth, accessToken, user_type } = useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();
  const navigate = useNavigate();
  const [snackbar, setsnackbar] = useState(false);
  const [message, setmessage] = useState("");
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

  // Add these after your existing state declarations
  const [isEditDumpingModalOpen, setIsEditDumpingModalOpen] = useState(false);
  const [editingDumping, setEditingDumping] = useState(null);

  const [updatingDumping, setUpdatingDumping] = useState(false);
  const [editError, setEditError] = useState("");
  const [editDumpingData, setEditDumpingData] = useState({
    street: "",
    city: "",
    region: "",
    latitude: "",
    longitude: "",
    postal_code: "",
  });
  const [mapCenter, setMapCenter] = useState([33.8938, 35.5018]);
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: truck,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const defaultOptions2 = {
    loop: true,
    autoplay: true,
    animationData: time,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

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

  // useEffect(() => {
  //   if (user_type && user_type !== "company") {
  //     navigate(-1);
  //   }
  // }, [navigate]);

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
        "http://localhost:8000/api/company/schedules/?future_only=true&available=true&status_param='Available"
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
        setmessage("Pickup created");
        setsnackbar(true);
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
        navigate(0);
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

  // Add these functions before the return statement
  const handleEditDumping = (dump) => {
    setEditingDumping(dump);
    setEditDumpingData({
      street: dump.address_detail?.street || "",
      city: dump.address_detail?.city || "",
      region: dump.address_detail?.region || "",
      latitude: dump.address_detail?.latitude || "",
      longitude: dump.address_detail?.longitude || "",
      postal_code: dump.address_detail?.postal_code || "",
    });

    // Set map center to current dumping location
    if (dump.address_detail?.latitude && dump.address_detail?.longitude) {
      setMapCenter([
        parseFloat(dump.address_detail.latitude),
        parseFloat(dump.address_detail.longitude),
      ]);
    }

    setIsEditDumpingModalOpen(true);
    setEditError("");
  };

  const handleEditDumpingInputChange = (e) => {
    const { name, value } = e.target;
    setEditDumpingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      if (data.address) {
        setEditDumpingData((prev) => ({
          ...prev,
          street: data.address.road || prev.street,
          city:
            data.address.city ||
            data.address.town ||
            data.address.village ||
            prev.city,
          region: data.address.state || prev.region,
          postal_code: data.address.postcode || prev.postal_code,
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };
  const handleUpdateDumping = async (e) => {
    e.preventDefault();

    // Validation
    if (!editDumpingData.latitude || !editDumpingData.longitude) {
      setEditError(
        "Latitude and Longitude are required. Click on the map to set location."
      );
      return;
    }

    if (!editDumpingData.street || !editDumpingData.city) {
      setEditError("Street and City are required");
      return;
    }

    setUpdatingDumping(true);
    setEditError("");

    try {
      const addressPayload = {
        street: editDumpingData.street,
        city: editDumpingData.city,
        region: editDumpingData.region,
        latitude: parseFloat(editDumpingData.latitude),
        longitude: parseFloat(editDumpingData.longitude),
        postal_code: editDumpingData.postal_code,
      };

      const addressResponse = await fetchWithAuth(
        `http://localhost:8000/api/auth/addresses/${editingDumping.address_detail.address_id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressPayload),
        }
      );

      if (!addressResponse.ok) {
        const errorData = await addressResponse.json();
        throw new Error(errorData.detail || "Failed to update address");
      }
      setmessage("Dumping location updated successfully");
      // Refresh the route data to show updated dumping info
      const updatedRoutes = await fetchRoutes();
      setRoutes(updatedRoutes);

      // Update selected route if it exists
      if (selectedRoute) {
        const updatedRoute = updatedRoutes.find(
          (r) => r.route_id === selectedRoute.route_id
        );
        if (updatedRoute) {
          setSelectedRoute(updatedRoute);
        }
      }

      // Close modal and reset
      setIsEditDumpingModalOpen(false);
      setsnackbar(true);

      setEditingDumping(null);
      setEditDumpingData({
        street: "",
        city: "",
        region: "",
        latitude: "",
        longitude: "",
        postal_code: "",
      });
    } catch (err) {
      console.error("Error updating dumping:", err);
      setEditError(`Failed to update location: ${err.message}`);
    } finally {
      setUpdatingDumping(false);
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setEditDumpingData((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
        setMapCenter([lat, lng]);
        reverseGeocode(lat, lng);
      },
    });

    return editDumpingData.latitude && editDumpingData.longitude ? (
      <Marker
        position={[
          parseFloat(editDumpingData.latitude),
          parseFloat(editDumpingData.longitude),
        ]}
      />
    ) : null;
  };
  const closesnackbar = () => {
    setsnackbar(false);
    setmessage("");
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
        <div
          className={`leftside ${selectedRoute ? "active" : "inactive"}`}
          style={{
            // borderWidth: 1,
            // borderColor: "black",
            // borderStyle: "solid",
            margin: 10,
          }}
        >
          {/* Route Selection */}
          <div
            className={`routecard ${selectedRoute ? "active" : "inactive"}`}
            style={{ marginBottom: selectedRoute ? 30 : 20, width: "100%" }}
          >
            <div
              className="titleroute"
              style={{
                marginBottom: selectedRoute ? 20 : 50,
                alignSelf: selectedRoute ? "flex-start" : "center",
              }}
            >
              <div
                className="iconroute"
                style={{
                  width: selectedRoute ? "4rem" : "6rem",
                  height: selectedRoute ? "4rem" : "6rem",
                }}
              >
                <Navigation
                  style={{
                    width: selectedRoute ? "2.25rem" : "3rem",
                    height: selectedRoute ? "2.25rem" : "3rem",
                    color: "#ffffff",
                  }}
                />
              </div>
              <h2
                className={`title-text ${
                  selectedRoute ? "active" : "inactive"
                }`}
              >
                Select Route
              </h2>
            </div>
            <div className={`lot ${selectedRoute ? "active" : "inactive"}`}>
              {!selectedRoute && (
                <div
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    marginBottom: 20,
                    alignSelf: "flex-start",
                  }}
                >
                  <Lottie
                    animationData={defaultOptions.animationData}
                    loop={defaultOptions.loop}
                    autoplay={defaultOptions.autoplay}
                    style={{ width: 350, height: 350 }}
                  />
                </div>
              )}

              {/* Search */}
              <div
                style={{
                  flex: 1,
                  marginLeft: selectedRoute ? 0 : 20,
                  alignSelf: selectedRoute ? "center" : "flex-start",
                  marginTop: selectedRoute ? 0 : 10,
                }}
              >
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
                      style={{
                        color: "#374151",
                        fontSize: 15,
                        fontWeight: 600,
                      }}
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
              </div>
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

          <div
            className={`routecard ${selectedRoute ? "active" : "inactive"}`}
            style={{ width: "100%", marginLeft: selectedRoute ? 0 : 60 }}
          >
            <div
              className="titleroute"
              style={{
                marginBottom: selectedRoute ? 20 : 0,
                alignSelf: selectedRoute ? "flex-start" : "center",
              }}
            >
              <div
                className="iconroute"
                style={{
                  width: selectedRoute ? "4rem" : "6rem",
                  height: selectedRoute ? "4rem" : "6rem",
                }}
              >
                <Calendar
                  style={{
                    width: selectedRoute ? "2.25rem" : "3rem",
                    height: selectedRoute ? "2.25rem" : "3rem",
                    color: "#ffffff",
                  }}
                />
              </div>
              <h2
                className={`title-text ${
                  selectedRoute ? "active" : "inactive"
                }`}
              >
                Select Schedule
              </h2>
            </div>
            {!selectedRoute && (
              <div
                style={{
                  marginBottom: 0,
                }}
              >
                <Lottie
                  animationData={defaultOptions2.animationData}
                  loop={defaultOptions2.loop}
                  autoplay={defaultOptions2.autoplay}
                  style={{ width: 350, height: 350 }}
                />
              </div>
            )}
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
            {selectedRoute && selectedSchedule && (
              <button
                onClick={handleCreatePickup}
                disabled={creatingPickup}
                className="createpickup"
                style={{
                  cursor: creatingPickup ? "not-allowed" : "pointer",
                  opacity: creatingPickup ? 0.6 : 1,
                  marginTop: 40,
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!creatingPickup) {
                    e.currentTarget.style.backgroundColor = "#e07a28";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(16, 185, 129, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creatingPickup) {
                    e.currentTarget.style.backgroundColor = "#e07a28";
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
        </div>
        {/* Right Panel - Map & Details */}
        {selectedRoute && selectedRoute.route_stops && (
          <div className="rightside">
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
                          <div style={{ flex: 1 }}>
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
                                <span>{dump.maximum_capacity || 0} kg</span>
                              </div>
                            )}
                          </div>
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditDumping(dump)}
                            className="editbtt"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#2563eb";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#3b82f6";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
          </div>
        )}
      </div>
      {/* Edit Dumping Modal */}
      <RightPopupModal
        isOpen={isEditDumpingModalOpen}
        onClose={() => {
          setIsEditDumpingModalOpen(false);
          setEditingDumping(null);
          setEditError("");
        }}
        title="Edit Dumping Location"
      >
        <div style={{ overflow: "auto", maxHeight: "calc(100vh - 120px)" }}>
          <form
            onSubmit={handleUpdateDumping}
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Map Section */}
            <div
              style={{
                border: "2px solid #4caf50",
                borderRadius: "10px",
                padding: "1rem",
                background: "#e8f5e9",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1rem 0",
                  color: "#2e7d32",
                  fontSize: "1rem",
                }}
              >
                📍 Update Location
              </h3>

              <p
                style={{
                  margin: "0 0 0.75rem 0",
                  fontSize: "0.875rem",
                  color: "#2e7d32",
                  fontWeight: "600",
                }}
              >
                Click on the map to set new coordinates
              </p>

              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{
                  height: "300px",
                  width: "100%",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                }}
                key={mapCenter.join(",")} // Force re-render when center changes
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker />
              </MapContainer>

              {/* Address Fields */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <input
                  name="street"
                  placeholder="Street *"
                  value={editDumpingData.street}
                  onChange={handleEditDumpingInputChange}
                  required
                  style={{
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                    width: "100%",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <input
                    name="city"
                    placeholder="City *"
                    value={editDumpingData.city}
                    onChange={handleEditDumpingInputChange}
                    required
                    style={{
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "1rem",
                      width: "100%",
                    }}
                  />

                  <input
                    name="region"
                    placeholder="Region"
                    value={editDumpingData.region}
                    onChange={handleEditDumpingInputChange}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "1rem",
                      width: "100%",
                    }}
                  />
                </div>

                <input
                  name="postal_code"
                  placeholder="Postal Code"
                  value={editDumpingData.postal_code}
                  onChange={handleEditDumpingInputChange}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                    width: "100%",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={editDumpingData.latitude}
                    onChange={handleEditDumpingInputChange}
                    disabled
                    style={{
                      padding: "0.75rem",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #ccc",
                      cursor: "not-allowed",
                      width: "100%",
                    }}
                  />

                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={editDumpingData.longitude}
                    onChange={handleEditDumpingInputChange}
                    disabled
                    style={{
                      padding: "0.75rem",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #ccc",
                      cursor: "not-allowed",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {editError && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#fee2e2",
                  border: "1px solid #ef4444",
                  borderRadius: "0.5rem",
                  color: "#991b1b",
                  fontSize: "0.875rem",
                }}
              >
                {editError}
              </div>
            )}

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                paddingTop: "1rem",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsEditDumpingModalOpen(false);
                  setEditingDumping(null);
                  setEditError("");
                }}
                style={{ width: "100%" }}
                className="cancelbutton"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#e5e7eb";
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingDumping}
                style={{
                  backgroundColor: updatingDumping ? "#9ca3af" : "#4caf50",
                  cursor: updatingDumping ? "not-allowed" : "pointer",
                  opacity: updatingDumping ? 0.6 : 1,
                  width: "100%",
                }}
                className="updatebutton"
                onMouseEnter={(e) => {
                  if (!updatingDumping) {
                    e.currentTarget.style.backgroundColor = "#2e7d32";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updatingDumping) {
                    e.currentTarget.style.backgroundColor = "#4caf50";
                  }
                }}
              >
                {updatingDumping ? "Updating..." : "Update Location"}
              </button>
            </div>
          </form>
        </div>
      </RightPopupModal>
      <AlertSnackbar
        open={snackbar}
        onClose={closesnackbar}
        message={message}
        severity="success"
        autoHideDuration={3000}
      />
    </div>
  );
};

export default CompanyPickups;
