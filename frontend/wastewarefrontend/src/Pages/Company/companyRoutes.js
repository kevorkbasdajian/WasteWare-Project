import React, { useState, useEffect, useContext } from "react";
import Navbar from "../../Components/navbar.js";
import { useNavigate } from "react-router-dom";
import HeaderBox from "../../Components/HeaderBox.js";
import "../../Styles/Page/companyRoutes.css";
import "../../Styles/Base/glass.css";
import { RightPopupModal } from "../../Components/RightModal.js";
import { DumpingSelector } from "../../Components/DumpingSelector.js";
import RouteTable from "../../Components/RouteTable.js";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useFetchWithAuth } from "../../Components/fetchWithAuth";
import { AuthContext } from "../../Components/AuthProvider.js";
import AlertSnackbar from "../../Components/Alert.js";
import Modalwindow from "../../Components/Modal.js";

const TruckRoutes = () => {
  const navigate = useNavigate();
  const fetchWithAuth = useFetchWithAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [snackbar, setsnackbar] = useState(false);
  const [message, setmessage] = useState("");
  const [errors, seterrors] = useState("");
  //Drivers
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversError, setDriversError] = useState(null);

  //Trucks
  const [driverTruck, setDriverTruck] = useState(null); // Truck already assigned to driver
  const [availableTrucks, setAvailableTrucks] = useState([]); // Available trucks if driver has none
  const [selectedTruck, setSelectedTruck] = useState(""); // Selected truck ID
  const [loadingTrucks, setLoadingTrucks] = useState(false);

  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [isAddTruckModalOpen, setIsAddTruckModalOpen] = useState(false);
  const [newDriverData, setNewDriverData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [newTruckData, setNewTruckData] = useState({
    available: true,
  });
  const [submittingDriver, setSubmittingDriver] = useState(false);
  const [submittingTruck, setSubmittingTruck] = useState(false);

  //Waste Types and dumpings
  const [wasteTypes, setWasteTypes] = useState([]);
  const [selectedWasteType, setSelectedWasteType] = useState("");
  const [loadingWasteTypes, setLoadingWasteTypes] = useState(false);
  const [selectedDumpings, setSelectedDumpings] = useState([]);

  //Route
  const [submittingRoute, setSubmittingRoute] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routesError, setRoutesError] = useState(null);
  const { accessToken, user_type, userData } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    truckId: "",
    wasteCategory: "",
    driverName: "",
    status: "",
  });
  const [viewallmodal, setviewallmodal] = useState(false);
  const COLORS = ["#ff9800", "#4caf50", "#2196f3", "#f44336"];
  // Colors for bars
  const BAR_COLORS = ["#4caf50", "#3b82f6", "#f44336", "#ff9800"];

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
    const token = accessToken;
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (user_type && user_type !== "company" && user_type !== "admin") {
      navigate(-1);
    }
  }, [navigate]);
  useEffect(() => {
    const fetchRoutes = async () => {
      setLoadingRoutes(true);
      setRoutesError(null);

      try {
        const response = await fetchWithAuth(
          "https://wasteware-project-production.up.railway.app/api/company/routes/"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch routes");
        }

        const data = await response.json();
        console.log("Routes loaded:", data);
        setRoutes(data);
      } catch (err) {
        console.error("Error fetching routes:", err);
        setRoutesError(err.message);
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchRoutes();
  }, []);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const removeDumping = (id) => {
    setSelectedDumpings((prev) => prev.filter((d) => d.dumping_id !== id));
  };

  const handleAddRoute = async () => {
    // Validation
    if (!formData.status) {
      seterrors("Please select a status");
      return;
    }
    if (!selectedWasteType) {
      seterrors("Please select a waste type");
      return;
    }
    if (!selectedDriver) {
      seterrors("Please select a driver");
      return;
    }

    if (!driverTruck && !selectedTruck) {
      seterrors("Please select a truck for this driver");
      return;
    }

    if (selectedDumpings.length === 0) {
      seterrors("Please select at least one dumping location");
      return;
    }

    setSubmittingRoute(true);

    try {
      // Build the route payload
      const routePayload = {
        driver_id: parseInt(selectedDriver),
        waste_type_id: parseInt(selectedWasteType),
        status: formData.status || "scheduled",
        dumpings: selectedDumpings.map((d) => ({ dumping_id: d.dumping_id })),
      };

      // Only add truck_id if driver doesn't already have a truck
      if (!driverTruck) {
        routePayload.truck_id = parseInt(selectedTruck);
      }

      console.log("Payload being sent:", routePayload); // FIXED - was 'payload'

      const response = await fetchWithAuth(
        "https://wasteware-project-production.up.railway.app/api/company/routes/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(routePayload),
        }
      );

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      if (!response.ok) {
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText);
          console.error("Error response:", errorData);
          throw new Error(errorData.detail || JSON.stringify(errorData));
        } catch (parseError) {
          // Not JSON, show text error
          console.error("Server error (text):", responseText);
          throw new Error("Server error: " + responseText.substring(0, 200));
        }
      }

      const createdRoute = JSON.parse(responseText);
      console.log("Route created successfully:", createdRoute);

      setsnackbar(true);
      setmessage("Route Created Successfully");

      // Add new route to state
      setRoutes((prev) => [createdRoute, ...prev]);

      // Reset form
      setSelectedDriver("");
      setDriverTruck(null);
      setSelectedTruck("");
      setAvailableTrucks([]);
      setSelectedWasteType("");
      setSelectedDumpings([]);
      setFormData({
        truckId: "",
        wasteCategory: "",
        driverName: "",
        status: "",
      });
      seterrors("");
    } catch (err) {
      console.error("Error creating route:", err);
      seterrors(`Failed to create route: ${err.message}`);
    } finally {
      setSubmittingRoute(false);
    }
  };
  useEffect(() => {
    const fetchDrivers = async () => {
      setLoadingDrivers(true);
      setDriversError(null);

      try {
        const response = await fetchWithAuth(
          "https://wasteware-project-production.up.railway.app/api/company/drivers/"
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch drivers: ${response.status}`);
        }

        const data = await response.json();
        console.log("Drivers loaded:", data);
        setDrivers(data);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setDriversError(err.message);
      } finally {
        setLoadingDrivers(false);
      }
    };

    fetchDrivers();
  }, []);

  const handleDriverChange = async (e) => {
    const driverId = e.target.value;

    if (driverId === "ADD_NEW") {
      setIsAddDriverModalOpen(true);
      return;
    }

    setSelectedDriver(driverId);

    // Reset truck-related state
    setDriverTruck(null);
    setSelectedTruck("");
    setAvailableTrucks([]);

    if (!driverId) {
      return;
    }

    setLoadingTrucks(true);

    try {
      // Check if driver already has a truck assigned
      const response = await fetchWithAuth(
        `https://wasteware-project-production.up.railway.app/api/company/trucks/?driver=${driverId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch driver's truck");
      }

      const trucks = await response.json();
      console.log("Driver's trucks:", trucks);

      if (trucks.length > 0) {
        // Driver HAS a truck - auto-fill and disable truck selector
        const truck = trucks[0];
        setDriverTruck(truck);
        setSelectedTruck(truck.truck_id.toString());
        console.log("Driver already has truck:", truck.truck_id);
      } else {
        // Driver has NO truck - load available trucks
        console.log("Driver has no truck, loading available trucks...");

        const availableResponse = await fetchWithAuth(
          "https://wasteware-project-production.up.railway.app/api/company/trucks/?available=true"
        );

        if (!availableResponse.ok) {
          throw new Error("Failed to fetch available trucks");
        }

        const availableTrucksData = await availableResponse.json();
        // Filter out trucks that already have a driver assigned
        const unassignedTrucks = availableTrucksData.filter((t) => !t.driver);

        console.log("Available trucks:", unassignedTrucks);
        setAvailableTrucks(unassignedTrucks);
      }
    } catch (err) {
      console.error("Error loading trucks:", err);
      alert("Failed to load truck information.");
    } finally {
      setLoadingTrucks(false);
    }
  };

  const closesnackbar = () => {
    setsnackbar(false);
    setmessage("");
  };

  //handle truck change
  const handleTruckChange = (e) => {
    const truckId = e.target.value;

    if (truckId === "ADD_NEW") {
      setIsAddTruckModalOpen(true);
      return;
    }

    setSelectedTruck(truckId);
  };

  //handle add driver
  const handleAddDriver = async (e) => {
    e.preventDefault();

    if (!newDriverData.first_name || !newDriverData.last_name) {
      alert("Please enter at least first and last name");
      return;
    }

    setSubmittingDriver(true);

    try {
      const response = await fetchWithAuth(
        "https://wasteware-project-production.up.railway.app/api/company/drivers/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newDriverData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add driver");
      }

      const newDriver = await response.json();
      console.log("New driver created:", newDriver);

      // Refresh drivers list
      setDrivers((prev) => [newDriver, ...prev]);

      // Select the new driver
      setSelectedDriver(newDriver.driver_id.toString());

      // Close modal and reset form
      setIsAddDriverModalOpen(false);
      setNewDriverData({ first_name: "", last_name: "", phone: "" });
      setsnackbar(true);
      setmessage("Driver added successfully");

      // Trigger truck loading for new driver (will have no truck)
      handleDriverChange({ target: { value: newDriver.driver_id.toString() } });
    } catch (err) {
      console.error("Error adding driver:", err);
      alert(`Failed to add driver: ${err.message}`);
    } finally {
      setSubmittingDriver(false);
    }
  };

  //handle new truck

  const handleAddTruck = async (e) => {
    e.preventDefault();

    setSubmittingTruck(true);

    try {
      const response = await fetchWithAuth(
        "https://wasteware-project-production.up.railway.app/api/company/trucks/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            available: true,
            driver_id: null, // New truck starts unassigned
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add truck");
      }

      const newTruck = await response.json();
      console.log("New truck created:", newTruck);

      // Add to available trucks list
      setAvailableTrucks((prev) => [...prev, newTruck]);

      // Select the new truck
      setSelectedTruck(newTruck.truck_id.toString());

      // Close modal and reset form
      setIsAddTruckModalOpen(false);
      setNewTruckData({ available: true });
      setsnackbar(true);
      setmessage("Truck added successfully");
    } catch (err) {
      console.error("Error adding truck:", err);
      alert(`Failed to add truck: ${err.message}`);
    } finally {
      setSubmittingTruck(false);
    }
  };

  //Waste Types

  useEffect(() => {
    const fetchWasteTypes = async () => {
      setLoadingWasteTypes(true);

      try {
        const response = await fetchWithAuth(
          "https://wasteware-project-production.up.railway.app/api/company/waste-types/" // Adjust URL based on your backend
        );

        if (!response.ok) {
          throw new Error("Failed to fetch waste types");
        }

        const data = await response.json();
        console.log("Waste types loaded:", data);
        setWasteTypes(data);
      } catch (err) {
        console.error("Error fetching waste types:", err);
        alert("Failed to load waste types");
      } finally {
        setLoadingWasteTypes(false);
      }
    };

    fetchWasteTypes();
  }, []);

  //Waste Type Change

  const handleWasteTypeChange = async (e) => {
    const wasteTypeId = e.target.value;
    setSelectedWasteType(wasteTypeId);

    // Reset selected dumpings when waste type changes
    setSelectedDumpings([]);

    if (!wasteTypeId) {
      return;
    }
  };

  const getRouteStatusData = () => {
    if (!routes || routes.length === 0) {
      return [
        // { name: "Scheduled", value: 0 },
        { name: "Active", value: 0 },
        { name: "Inactive", value: 0 },
        // { name: "Cancelled", value: 0 },
      ];
    }

    const statusCounts = routes.reduce((acc, route) => {
      const status = route.status || "scheduled";
      // Capitalize first letter for display
      const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
      acc[displayStatus] = (acc[displayStatus] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: "Scheduled", value: statusCounts.Scheduled || 0 },
      { name: "Active", value: statusCounts.Active || 0 },
      { name: "Inactive", value: statusCounts.Inactive || 0 },
      // { name: "Cancelled", value: statusCounts.Cancelled || 0 },
    ];
  };

  // Calculate waste type distribution for bar chart
  const getWasteTypeData = () => {
    if (
      !routes ||
      routes.length === 0 ||
      !wasteTypes ||
      wasteTypes.length === 0
    ) {
      return wasteTypes.map((type) => ({
        wasteType: type.name,
        count: 0,
      }));
    }

    // Count routes by waste type
    const wasteTypeCounts = routes.reduce((acc, route) => {
      const wasteTypeId = route.waste_type.waste_type_id;
      acc[wasteTypeId] = (acc[wasteTypeId] || 0) + 1;
      return acc;
    }, {});

    // Map to waste type names
    return wasteTypes.map((type) => ({
      wasteType: type.name,
      count: wasteTypeCounts[type.waste_type_id] || 0,
    }));
  };
  const modifyviewallmodal = (value) => {
    console.log("Modal view is:", value);
    setviewallmodal(value);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #6fc276ff 0%,  100%)",
        padding: "2rem",
      }}
    >
      <Navbar
        o
        links={links}
        profileImage={
          userData?.avatar
            ? `https://wasteware-project-production.up.railway.app${userData.avatar}`
            : "https://ui-avatars.com/api/?name=Company&background=10B981&color=fff&size=150"
        }
        profilePath="/company/profile"
      />
      <div style={{ marginTop: 80 }}>
        <HeaderBox
          text="Truck Routes"
          gradientColors={"--gradient-light-green"}
        />
      </div>

      {/* Dumping Selection Modal */}
      <RightPopupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Select Dumpings"
      >
        <DumpingSelector
          selectedDumpings={selectedDumpings}
          setSelectedDumpings={setSelectedDumpings}
          wasteTypeId={selectedWasteType} // Pass selected waste type
        />
      </RightPopupModal>

      <RightPopupModal
        isOpen={isAddDriverModalOpen}
        onClose={() => setIsAddDriverModalOpen(false)}
        title="Add New Driver"
      >
        <div
          style={{
            overflow: "hidden",
          }}
        >
          <form
            onSubmit={handleAddDriver}
            style={{
              padding: "1rem",
            }}
          >
            <div
              style={{
                marginRight: "auto",
                marginBottom: "1rem",

                width: "90%",
              }}
            >
              <label
                style={{
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                First Name *
              </label>
              <input
                type="text"
                value={newDriverData.first_name}
                onChange={(e) =>
                  setNewDriverData((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                placeholder="Enter first name"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div
              style={{
                marginBottom: "1rem",
                marginRight: "auto",
                width: "90%",
              }}
            >
              <label
                style={{
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Last Name *
              </label>
              <input
                type="text"
                value={newDriverData.last_name}
                onChange={(e) =>
                  setNewDriverData((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                placeholder="Enter last name"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div
              style={{
                marginRight: "auto",
                marginBottom: "1.5rem",
                width: "90%",
              }}
            >
              <label
                style={{
                  fontWeight: "bold",
                }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                value={newDriverData.phone}
                onChange={(e) =>
                  setNewDriverData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Enter phone number"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => setIsAddDriverModalOpen(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#ccc",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingDriver}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: submittingDriver ? "wait" : "pointer",
                  opacity: submittingDriver ? 0.6 : 1,
                  width: "100%",
                }}
              >
                {submittingDriver ? "Adding..." : "Add Driver"}
              </button>
            </div>
          </form>
        </div>
      </RightPopupModal>

      {/* Add Truck Modal */}
      <RightPopupModal
        isOpen={isAddTruckModalOpen}
        onClose={() => setIsAddTruckModalOpen(false)}
        title="Add New Truck"
      >
        <form onSubmit={handleAddTruck} style={{ padding: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <p
              style={{
                color: "#666",
                marginBottom: "1.5rem",
                textAlign: "center",
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              A new truck will be created and will be available for assignment
              to the selected driver.
            </p>
          </div>

          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f0f9ff",
              borderRadius: "4px",
              marginBottom: "1.5rem",
              // borderStyle: "solid",
              // borderWidth: 10,
              // borderColor: "red",
              width: "50%",
              height: 100,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}
            >
              <i
                className="fa-solid fa-truck fa-2x"
                style={{ color: "#4caf50" }}
              />
              <span style={{ fontWeight: "bold", fontSize: 20 }}>
                New Truck
              </span>
            </div>
            <div
              style={{
                marginTop: "0.5rem",
                color: "#666",
                fontSize: "0.9rem",
              }}
            >
              Status: Available
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              gap: "1rem",
            }}
          >
            <button
              type="button"
              onClick={() => setIsAddTruckModalOpen(false)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#ccc",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTruck}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: submittingTruck ? "wait" : "pointer",
                opacity: submittingTruck ? 0.6 : 1,
                width: "100%",
              }}
            >
              {submittingTruck ? "Adding..." : "Add Truck"}
            </button>
          </div>
        </form>
      </RightPopupModal>

      {/* Add Route Form */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 20,
        }}
      >
        <div className="glass2 c">
          <div className="b1t1holder">
            <p className="b1t1">Add New Truck Route</p>
          </div>

          <div className="grid">
            <select
              name="status"
              className="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="">Status *</option>
              {/* <option value="scheduled">Scheduled</option> */}
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              {/* <option value="cancelled">Cancelled</option> */}
            </select>
            <select
              name="wasteCategory"
              className="wasteCategory"
              value={selectedWasteType}
              onChange={handleWasteTypeChange}
              disabled={loadingWasteTypes}
              style={{
                cursor: loadingWasteTypes ? "wait" : "pointer",
                opacity: loadingWasteTypes ? 0.6 : 1,
              }}
            >
              <option value="">
                {loadingWasteTypes ? "Loading..." : "Waste Type *"}
              </option>
              {wasteTypes.map((type) => (
                <option key={type.waste_type_id} value={type.waste_type_id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid">
            <select
              name="driverName"
              className="driverName"
              value={selectedDriver}
              onChange={handleDriverChange}
              disabled={loadingDrivers}
              style={{
                cursor: loadingDrivers ? "wait" : "pointer",
                opacity: loadingDrivers ? 0.6 : 1,
              }}
            >
              <option value="">
                {loadingDrivers
                  ? "Loading drivers..."
                  : driversError
                  ? "Error loading drivers"
                  : "Select Driver *"}
              </option>
              {drivers.map((driver) => (
                <option key={driver.driver_id} value={driver.driver_id}>
                  {driver.first_name} {driver.last_name}
                </option>
              ))}
              <option
                value="ADD_NEW"
                style={{ fontWeight: "bold", color: "#4caf50" }}
              >
                + Add New Driver
              </option>
            </select>
            <div style={{ marginTop: "0rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Truck {driverTruck ? "(Auto-assigned)" : "*"}
              </label>

              {loadingTrucks ? (
                <div style={{ padding: "0.75rem", color: "#666" }}>
                  Loading truck info...
                </div>
              ) : driverTruck ? (
                // Driver already has a truck - show it (disabled)
                <input
                  type="text"
                  value={`Truck #${driverTruck.truck_id} (Assigned)`}
                  disabled
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "not-allowed",
                  }}
                />
              ) : selectedDriver && availableTrucks.length > 0 ? (
                // Driver has no truck - show available trucks
                <select
                  name="truckId"
                  className="truckid"
                  value={selectedTruck}
                  onChange={(e) => handleTruckChange(e)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                  }}
                >
                  <option value="">Select Truck *</option>
                  {availableTrucks.map((truck) => (
                    <option key={truck.truck_id} value={truck.truck_id}>
                      Truck #{truck.truck_id}
                    </option>
                  ))}
                  <option
                    value="ADD_NEW"
                    style={{ fontWeight: "bold", color: "#4caf50" }}
                  >
                    + Add New Truck
                  </option>
                </select>
              ) : selectedDriver ? (
                <div style={{ padding: "0.75rem", color: "#f44336" }}>
                  {/* No available trucks. Please add a new truck. */}
                  <select
                    name="truckId"
                    className="truckid"
                    value={selectedTruck}
                    onChange={(e) => setSelectedTruck(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                    }}
                  >
                    <option value="">Select Truck *</option>

                    <option
                      value="ADD_NEW"
                      style={{ fontWeight: "bold", color: "#4caf50" }}
                    >
                      + Add New Truck
                    </option>
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Select a driver first"
                  disabled
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              )}
            </div>
          </div>

          <div className="dumpingdiv">
            <div
              onClick={() => setIsModalOpen(true)}
              className="dumping-card-style"
            >
              <i
                className="fa-solid fa-location-dot "
                style={{ marginTop: 20 }}
              ></i>
              <div className="title">Add Dumping Locations</div>
              <div className="subtitle">
                {selectedDumpings.length > 0
                  ? `${selectedDumpings.length} location${
                      selectedDumpings.length > 1 ? "s" : ""
                    } selected`
                  : "Click to select route stops"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginTop: "1rem",
                alignItems: "center",
              }}
            >
              {selectedDumpings.map((d) => (
                <div key={d.dumping_id} className="dumping">
                  <i
                    className="fa-solid fa-trash fa-sm"
                    style={{ color: "#388e3c" }}
                  ></i>
                  <span style={{ fontSize: "0.85rem" }}>{d.Title}</span>
                  <span
                    onClick={() => removeDumping(d.dumping_id)}
                    style={{ fontWeight: 700, cursor: "pointer" }}
                  >
                    x
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="addRouteButton">
            <button
              className="actualButton"
              onClick={handleAddRoute}
              style={{
                backgroundColor: "#4caf50",
                fontSize: "25px",
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              <i
                className="fa-solid fa-plus"
                style={{ marginRight: "0.5rem" }}
              />{" "}
              Add Route
            </button>
            {errors && (
              <p style={{ fontSize: 17, color: "red", textAlign: "center" }}>
                {errors}
              </p>
            )}
            <button
              className="actualButton"
              onClick={() => modifyviewallmodal(true)}
              style={{
                backgroundColor: "#009688",
                fontSize: "25px",
                marginTop: 15,
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              <i className="fa  fa-eye" style={{ marginRight: "0.5rem" }} />
              View All Routes
            </button>
          </div>
        </div>

        <div className="glass2 c">
          <div className="b1t1holder">
            <p className="b1t1">Statistics</p>
          </div>

          <div className="containerforcharts">
            {loadingRoutes ? (
              <div
                style={{ textAlign: "center", padding: "2rem", color: "#666" }}
              >
                Loading statistics...
              </div>
            ) : routesError ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#f44336",
                }}
              >
                Error loading statistics
              </div>
            ) : (
              <>
                <div>
                  <div className="charttitle">Truck Routes by Status</div>
                  <PieChart width={400} height={400} style={{ marginTop: 50 }}>
                    <Pie
                      data={getRouteStatusData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      // label prop removed to hide labels
                    >
                      {getRouteStatusData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="vertical"
                      align="center"
                      verticalAlign="bottom"
                      iconSize={10}
                      wrapperStyle={{ bottom: 0, left: 0 }}
                    />
                  </PieChart>
                </div>
                <div>
                  <div className="charttitle" style={{ marginBottom: 10 }}>
                    Waste Type Distribution
                  </div>
                  <BarChart
                    width={520}
                    height={400}
                    data={getWasteTypeData()}
                    margin={{ top: 20, right: 60, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="wasteType" />
                    <YAxis />
                    <Tooltip />
                    {/* <Legend /> */}
                    <Bar dataKey="count">
                      {getWasteTypeData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <AlertSnackbar
        open={snackbar}
        onClose={closesnackbar}
        message={message}
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
          <p className="modaltitle"> All Truck Routes</p>

          {/* Add the table here */}
          <div style={{ marginTop: "20px", padding: "20px" }}>
            {loadingRoutes ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                Loading routes...
              </p>
            ) : routesError ? (
              <p style={{ textAlign: "center", color: "#f44336" }}>
                Error loading routes
              </p>
            ) : (
              <RouteTable routes={routes} />
            )}
          </div>
        </div>
      </Modalwindow>
    </div>
  );
};

export default TruckRoutes;
