import React, { useState } from "react";
import "../Styles/Component/RouteTable.css";

const RouteTable = ({ routes }) => {
  return (
    <div className="route-table-wrapper">
      <table className="route-table">
        <thead>
          <tr>
            <th></th>
            <th>Route ID</th>
            <th>Driver</th>
            <th>Waste Type</th>
            <th>Truck ID</th>
            <th># Stops</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {routes && routes.length > 0 ? (
            routes.map((route) => (
              <RouteRow key={route.route_id} route={route} />
            ))
          ) : (
            <tr>
              <td colSpan="8" className="no-data">
                No routes available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const RouteRow = ({ route }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "#4caf50",
      inactive: "#9e9e9e",
      scheduled: "#2196f3",
      cancelled: "#f44336",
    };
    return colors[status?.toLowerCase()] || "#757575";
  };

  return (
    <>
      <tr className="route-row">
        <td className="collapse-cell">
          <button
            className="collapse-button"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "▲" : "▼"}
          </button>
        </td>
        <td className="route-id center">#{route.route_id}</td>
        <td className="center">
          {route.driver
            ? `${route.driver.first_name} ${route.driver.last_name}`
            : "N/A"}
        </td>
        <td className="center">{route.waste_type?.name || "N/A"}</td>
        <td className="center">{route.truck?.truck_id || "N/A"}</td>
        <td className="center">{route.route_stops?.length || 0}</td>
        <td className="center">
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(route.status) }}
          >
            {route.status?.charAt(0).toUpperCase() + route.status?.slice(1) ||
              "N/A"}
          </span>
        </td>
        <td className="date center">{formatDate(route.created_at)}</td>
      </tr>

      {isOpen && (
        <tr className="details-row">
          <td colSpan="8">
            <div className="details-container">
              <h3 className="details-title">Route Details</h3>

              {/* Three Info Cards */}
              <div className="info-cards-grid">
                {/* Driver Card */}
                <div className="info-card driver-card">
                  <div className="card-header">
                    <i className="fa-solid fa-user"></i>
                    <h4>Driver Information</h4>
                  </div>
                  <div className="card-content">
                    <p>
                      <strong>Name:</strong>{" "}
                      {route.driver
                        ? `${route.driver.first_name} ${route.driver.last_name}`
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Driver ID:</strong>{" "}
                      {route.driver?.driver_id || "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {route.driver?.phone || "N/A"}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(route.driver?.created_at)}
                    </p>
                  </div>
                </div>

                {/* Truck Card */}
                <div className="info-card truck-card">
                  <div className="card-header">
                    <i className="fa-solid fa-truck"></i>
                    <h4>Truck Information</h4>
                  </div>
                  <div className="card-content">
                    <p>
                      <strong>Truck ID:</strong>{" "}
                      {route.truck?.truck_id || "N/A"}
                    </p>
                    <p>
                      <strong>Available:</strong>{" "}
                      <span
                        className={`availability ${
                          route.truck?.available ? "yes" : "no"
                        }`}
                      >
                        {route.truck?.available ? "Yes" : "No"}
                      </span>
                    </p>
                    <p>
                      <strong>Assigned Driver:</strong>{" "}
                      {route.truck?.driver
                        ? `${route.truck.driver.first_name} ${route.truck.driver.last_name}`
                        : "None"}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(route.truck?.created_at)}
                    </p>
                  </div>
                </div>

                {/* Waste Type Card */}
                <div className="info-card waste-card">
                  <div className="card-header">
                    <i className="fa-solid fa-trash"></i>
                    <h4>Waste Type</h4>
                  </div>
                  <div className="card-content">
                    <p>
                      <strong>Type:</strong> {route.waste_type?.name || "N/A"}
                    </p>
                    <p>
                      <strong>Type ID:</strong>{" "}
                      {route.waste_type?.waste_type_id || "N/A"}
                    </p>
                    <p>
                      <strong>Description:</strong>{" "}
                      {route.waste_type?.description ||
                        "No description available"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Route Stops Section */}
              <div className="route-stops-section">
                <h4 className="stops-header">
                  <i className="fa-solid fa-location-dot"></i> Route Stops (
                  {route.route_stops?.length || 0})
                </h4>

                {route.route_stops && route.route_stops.length > 0 ? (
                  <table className="stops-table">
                    <thead>
                      <tr>
                        <th>Stop #</th>
                        <th>Location Name</th>
                        <th>Address</th>
                        <th>Max Capacity</th>
                        <th>Collected</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {route.route_stops.map((stop, index) => (
                        <tr key={index}>
                          <td className="stop-number">{index + 1}</td>
                          <td className="location-name">
                            {stop.dumping?.Title || "N/A"}
                          </td>
                          <td>
                            {stop.dumping?.address_detail
                              ? `${stop.dumping.address_detail.street}, ${stop.dumping.address_detail.city}`
                              : "N/A"}
                          </td>
                          <td>
                            {stop.dumping?.maximum_capacity
                              ? `${stop.dumping.maximum_capacity} kg`
                              : "N/A"}
                          </td>
                          <td>
                            {stop.dumping?.collected_waste !== undefined
                              ? `${stop.dumping.collected_waste} kg`
                              : "0 kg"}
                          </td>
                          <td>
                            <span
                              className={`stop-status ${
                                stop.has_passed ? "completed" : "pending"
                              }`}
                            >
                              {stop.has_passed ? "Completed" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-stops">No route stops assigned</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default RouteTable;
