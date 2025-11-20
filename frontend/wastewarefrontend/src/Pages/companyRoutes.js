import React, { useState } from "react";
import Navbar from "../Components/navbar.js";
import { useNavigate } from "react-router-dom";

const TruckRoutes = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    truckId: "",
    wasteCategory: "",
    routeStops: "",
    driverName: "",
    status: "",
  });
  const links = [
    {
      name: "Home",
      path: "/Company",
      color: "var(--gradient-red)",
      glowColor: "#EF4444", // Solid color for LED glow
      icon: <i className="fa-solid fa-house fa-lg" />,
    },
    {
      name: "Routes",
      path: "/Company/Routes",
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: <i className="fa-solid fa-map-location-dot fa-lg" />,
    },
    {
      name: "Schedule",
      path: "/Company/Schedule",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: <i className="fa-solid fa-camera fa-lg" />,
    },
    {
      name: "Notifications",
      path: "/Company/Notifications",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: <i className="fa-solid fa-gift fa-lg" />,
    },
    {
      name: "Reports",
      path: "/Company/Reports",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: <i className="fa-solid fa-user fa-lg" />,
    },
    {
      name: "Profile",
      path: "/Company/Profile",
      color: "var(--gradient-green-blue)",
      glowColor: "#9d10b9ff",
      icon: <i className="fa-solid fa-user fa-lg" />,
    },
  ];
  const [routes, setRoutes] = useState([
    { id: 1, name: "Route 1", status: "Active" },
    { id: 2, name: "Route 2", status: "Active" },
    { id: 3, name: "Route 3", status: "Active" },
    { id: 4, name: "Route 4", status: "Active" },
    { id: 5, name: "Route 5", status: "Scheduled" },
    { id: 7, name: "Route 7", status: "Inactive" },
    { id: 9, name: "Route 9", status: "Scheduled" },
    { id: 11, name: "Route 11", status: "Inactive" },
    { id: 28, name: "Route 28", status: "Inactive" },
    { id: 43, name: "Route 43", status: "Scheduled" },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddRoute = () => {
    if (
      formData.truckId &&
      formData.wasteCategory &&
      formData.routeStops &&
      formData.driverName &&
      formData.status
    ) {
      const newRoute = {
        id: routes.length + 1,
        name: `Route ${formData.truckId}`,
        status: formData.status,
        ...formData,
      };
      setRoutes([...routes, newRoute]);
      setFormData({
        truckId: "",
        wasteCategory: "",
        routeStops: "",
        driverName: "",
        status: "",
      });
    }
  };

  const statusCounts = {
    Active: routes.filter((r) => r.status === "Active").length,
    Scheduled: routes.filter((r) => r.status === "Scheduled").length,
    Inactive: routes.filter((r) => r.status === "Inactive").length,
  };

  const totalRoutes = routes.length;
  const activePercentage = ((statusCounts.Active / totalRoutes) * 100).toFixed(
    0
  );
  const scheduledPercentage = (
    (statusCounts.Scheduled / totalRoutes) *
    100
  ).toFixed(0);
  const inactivePercentage = (
    (statusCounts.Inactive / totalRoutes) *
    100
  ).toFixed(0);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
        padding: "2rem",
      }}
    >
      <Navbar links={links} />

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(90deg, #66bb6a 0%, #43a047 100%)",
          borderRadius: "20px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          padding: "2rem",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            color: "white",
            textAlign: "center",
            margin: 0,
          }}
        >
          Truck Routes
        </h1>
      </div>

      {/* Add New Route Form */}
      <div
        style={{
          background: "rgba(200, 230, 201, 0.6)",
          borderRadius: "20px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          padding: "2rem",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#2e7d32",
            marginBottom: "1.5rem",
            marginTop: 0,
          }}
        >
          Add New Truck Route
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <input
            type="number"
            name="truckId"
            value={formData.truckId}
            onChange={handleInputChange}
            placeholder="Truck ID *"
            style={{
              padding: "0.875rem 1.25rem",
              borderRadius: "25px",
              border: "2px solid #a5d6a7",
              outline: "none",
              fontSize: "1rem",
              background: "white",
              transition: "all 0.3s",
            }}
          />

          <select
            name="wasteCategory"
            value={formData.wasteCategory}
            onChange={handleInputChange}
            style={{
              padding: "0.875rem 1.25rem",
              borderRadius: "25px",
              border: "2px solid #a5d6a7",
              outline: "none",
              fontSize: "1rem",
              background: "white",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          >
            <option value="">Waste Category *</option>
            <option value="Organic">Organic</option>
            <option value="Recyclable">Recyclable</option>
            <option value="Hazardous">Hazardous</option>
            <option value="General">General</option>
          </select>
        </div>

        <textarea
          name="routeStops"
          value={formData.routeStops}
          onChange={handleInputChange}
          placeholder="Route Stops (comma-separated) *"
          style={{
            width: "100%",
            padding: "0.875rem 1.25rem",
            borderRadius: "15px",
            border: "2px solid #a5d6a7",
            outline: "none",
            fontSize: "1rem",
            background: "white",
            marginBottom: "1.5rem",
            resize: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          rows="3"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <input
            type="text"
            name="driverName"
            value={formData.driverName}
            onChange={handleInputChange}
            placeholder="Driver Name *"
            style={{
              padding: "0.875rem 1.25rem",
              borderRadius: "25px",
              border: "2px solid #a5d6a7",
              outline: "none",
              fontSize: "1rem",
              background: "white",
              transition: "all 0.3s",
            }}
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            style={{
              padding: "0.875rem 1.25rem",
              borderRadius: "25px",
              border: "2px solid #a5d6a7",
              outline: "none",
              fontSize: "1rem",
              background: "white",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          >
            <option value="">Status *</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <button
          onClick={handleAddRoute}
          style={{
            background: "#4caf50",
            color: "white",
            fontWeight: "600",
            padding: "0.875rem 2rem",
            borderRadius: "25px",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            boxShadow: "0 4px 12px rgba(76,175,80,0.3)",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#43a047";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(76,175,80,0.4)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#4caf50";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(76,175,80,0.3)";
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>+</span> Add Route
        </button>
      </div>

      {/* Routes Section */}
      <div
        style={{
          background: "rgba(200, 230, 201, 0.6)",
          borderRadius: "20px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          padding: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#2e7d32",
            marginBottom: "2rem",
            marginTop: 0,
          }}
        >
          Routes
        </h2>

        <div
          style={{
            display: "flex",
            gap: "3rem",
            alignItems: "center",
          }}
        >
          {/* Pie Chart */}
          <div
            style={{
              position: "relative",
              width: "320px",
              height: "320px",
              flexShrink: 0,
            }}
          >
            <svg
              viewBox="0 0 200 200"
              style={{
                width: "100%",
                height: "100%",
                transform: "rotate(-90deg)",
              }}
            >
              {/* Blue (Active) */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="60"
                strokeDasharray={`${activePercentage * 5.02} ${100 * 5.02}`}
                strokeDashoffset="0"
              />
              {/* Purple (Scheduled) */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="60"
                strokeDasharray={`${scheduledPercentage * 5.02} ${100 * 5.02}`}
                strokeDashoffset={`-${activePercentage * 5.02}`}
              />
              {/* Cyan (Inactive) */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="60"
                strokeDasharray={`${inactivePercentage * 5.02} ${100 * 5.02}`}
                strokeDashoffset={`-${
                  (activePercentage + scheduledPercentage) * 5.02
                }`}
              />
            </svg>
            {/* Center text */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "3rem",
                    fontWeight: "700",
                    color: "#3b82f6",
                  }}
                >
                  {activePercentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            {/* Active Routes */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#14b8a6",
                  }}
                ></div>
                <h3
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: "#14b8a6",
                    margin: 0,
                  }}
                >
                  Active
                </h3>
              </div>
              <div style={{ paddingLeft: "1.75rem" }}>
                {routes
                  .filter((r) => r.status === "Active")
                  .map((route) => (
                    <div
                      key={route.id}
                      style={{
                        color: "#0d9488",
                        fontWeight: "500",
                        fontSize: "1rem",
                        marginBottom: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ color: "#14b8a6" }}>- -</span> {route.name}
                    </div>
                  ))}
              </div>
            </div>

            {/* Scheduled Routes */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                  }}
                ></div>
                <h3
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: "#3b82f6",
                    margin: 0,
                  }}
                >
                  Scheduled
                </h3>
              </div>
              <div style={{ paddingLeft: "1.75rem" }}>
                {routes
                  .filter((r) => r.status === "Scheduled")
                  .map((route) => (
                    <div
                      key={route.id}
                      style={{
                        color: "#2563eb",
                        fontWeight: "500",
                        fontSize: "1rem",
                        marginBottom: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ color: "#3b82f6" }}>- -</span> {route.name}
                    </div>
                  ))}
              </div>
            </div>

            {/* Inactive Routes */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#a855f7",
                  }}
                ></div>
                <h3
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: "#a855f7",
                    margin: 0,
                  }}
                >
                  Inactive
                </h3>
              </div>
              <div style={{ paddingLeft: "1.75rem" }}>
                {routes
                  .filter((r) => r.status === "Inactive")
                  .map((route) => (
                    <div
                      key={route.id}
                      style={{
                        color: "#9333ea",
                        fontWeight: "500",
                        fontSize: "1rem",
                        marginBottom: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ color: "#a855f7" }}>- -</span> {route.name}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckRoutes;
