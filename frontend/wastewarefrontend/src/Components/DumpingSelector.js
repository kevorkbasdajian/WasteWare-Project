import React, { useState, useEffect } from "react";
import { useFetchWithAuth } from "./fetchWithAuth";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export const DumpingSelector = ({
  selectedDumpings,
  setSelectedDumpings,
  wasteTypeId,
}) => {
  const fetchWithAuth = useFetchWithAuth();

  const [expanded, setExpanded] = useState({});
  const [success, setSuccess] = useState({});
  const [allDumpings, setAllDumpings] = useState([]);
  const [loadingDumpings, setLoadingDumpings] = useState(false);
  const [submittingNewDumping, setSubmittingNewDumping] = useState(false);

  const [mapCenter, setMapCenter] = useState([33.8938, 35.5018]);
  const [error, seterror] = useState("");
  const [newDumping, setNewDumping] = useState({
    Title: "",
    maximum_capacity: "",
    street: "",
    city: "",
    region: "",
    latitude: "",
    longitude: "",
    postal_code: "",
  });

  // Load dumpings when waste type changes
  useEffect(() => {
    setAllDumpings([]);
    if (!wasteTypeId) {
      setAllDumpings([]);
      return;
    }

    const fetchDumpings = async () => {
      setLoadingDumpings(true);

      try {
        const response = await fetchWithAuth(
          `http://localhost:8000/api/company/dumpings/?waste_type=${wasteTypeId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dumpings");
        }

        const data = await response.json();
        console.log("Dumpings loaded:", data);
        setAllDumpings(data);
      } catch (err) {
        console.error("Error fetching dumpings:", err);
        alert("Failed to load dumping locations");
      } finally {
        setLoadingDumpings(false);
      }
    };

    fetchDumpings();
  }, [wasteTypeId]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addDumping = (dumping) => {
    if (selectedDumpings.some((d) => d.dumping_id === dumping.dumping_id))
      return;

    setSelectedDumpings([...selectedDumpings, dumping]);

    // Show success message
    setSuccess((prev) => ({ ...prev, [dumping.dumping_id]: true }));

    // Auto-hide success after 2 sec
    setTimeout(() => {
      setSuccess((prev) => ({ ...prev, [dumping.dumping_id]: false }));
    }, 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDumping((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createNewDumping = async () => {
    // Validation
    if (
      !newDumping.Title ||
      !newDumping.street ||
      !newDumping.city ||
      !newDumping.longitude ||
      !newDumping.latitude ||
      !newDumping.region
    ) {
      seterror("Please fill in all of the fields!");
      // alert("Please fill in all of the fields");
      return;
    }

    if (!wasteTypeId) {
      alert("Waste type not selected");
      return;
    }

    setSubmittingNewDumping(true);

    try {
      // Create dumping with nested address
      const payload = {
        Title: newDumping.Title,
        waste_type: parseInt(wasteTypeId),
        address: {
          street: newDumping.street,
          city: newDumping.city,
          region: newDumping.region || "",
          latitude: newDumping.latitude
            ? parseFloat(newDumping.latitude)
            : null,
          longitude: newDumping.longitude
            ? parseFloat(newDumping.longitude)
            : null,
          postal_code: newDumping.postal_code || "",
        },
        maximum_capacity: newDumping.maximum_capacity
          ? parseInt(newDumping.maximum_capacity)
          : null,
      };

      console.log("Creating dumping with payload:", payload);

      const response = await fetchWithAuth(
        "http://localhost:8000/api/company/dumpings/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.detail || "Failed to create dumping");
      }

      const newItem = await response.json();
      console.log("Dumping created:", newItem);

      // Add to list
      setAllDumpings([newItem, ...allDumpings]);

      // Reset form
      setNewDumping({
        Title: "",
        maximum_capacity: "",
        street: "",
        city: "",
        region: "",
        latitude: "",
        longitude: "",
        postal_code: "",
      });
      seterror("");

      // Automatically select the newly created dumping
      addDumping(newItem);

      alert("Dumping created successfully!");
    } catch (err) {
      console.error("Error creating dumping:", err);
      alert(`Failed to create dumping: ${err.message}`);
    } finally {
      setSubmittingNewDumping(false);
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setNewDumping((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
        setMapCenter([lat, lng]);
        reverseGeocode(lat, lng);
      },
    });

    return newDumping.latitude && newDumping.longitude ? (
      <Marker
        position={[
          parseFloat(newDumping.latitude),
          parseFloat(newDumping.longitude),
        ]}
      />
    ) : null;
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      if (data.address) {
        setNewDumping((prev) => ({
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

  if (!wasteTypeId) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        Please select a waste type first
      </div>
    );
  }

  if (loadingDumpings) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        Loading dumping locations...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* List of all dumpings */}
      {allDumpings.length === 0 ? (
        <div style={{ padding: "1rem", textAlign: "center", color: "#666" }}>
          No dumping locations found for this waste type. Create one below.
        </div>
      ) : (
        allDumpings.map((dump) => {
          const isAdded = selectedDumpings.some(
            (d) => d.dumping_id === dump.dumping_id
          );

          return (
            <div
              key={dump.dumping_id}
              style={{
                border: "1px solid #ddd",
                padding: "1rem",
                borderRadius: "10px",
                background: "#fafafa",
              }}
            >
              {/* Top Row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{dump.Title}</p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
                    {dump.address_detail
                      ? `${dump.address_detail.street}, ${dump.address_detail.city}`
                      : `Address ID: ${dump.address}`}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {!isAdded && (
                    <button
                      onClick={() => addDumping(dump)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                  )}

                  <button
                    onClick={() => toggleExpand(dump.dumping_id)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      border: "1px solid #ccc",
                      background: "white",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {expanded[dump.dumping_id] ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {/* Success Message */}
              {success[dump.dumping_id] && (
                <p
                  style={{
                    color: "#4caf50",
                    marginTop: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  ✓ Added successfully!
                </p>
              )}

              {/* Expanded Details */}
              {expanded[dump.dumping_id] && (
                <div style={{ marginTop: "1rem", paddingLeft: "0.5rem" }}>
                  <p style={{ margin: "0.3rem 0" }}>
                    Maximum Capacity: {dump.maximum_capacity || "N/A"}
                  </p>
                  <p style={{ margin: "0.3rem 0" }}>
                    Collected Waste: {dump.collected_waste || 0}
                  </p>
                  {dump.address_detail && (
                    <>
                      <p style={{ margin: "0.3rem 0" }}>
                        Region: {dump.address_detail.region || "N/A"}
                      </p>
                      {dump.address_detail.latitude &&
                        dump.address_detail.longitude && (
                          <p style={{ margin: "0.3rem 0" }}>
                            Coordinates: {dump.address_detail.latitude},{" "}
                            {dump.address_detail.longitude}
                          </p>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* New Dumping Form */}
      <div
        style={{
          border: !error ? "2px solid #4caf50" : "2px solid red",
          borderRadius: "10px",
          padding: "1rem",
          background: " #e8f5e9",
        }}
      >
        <h3 style={{ margin: "0 0 1rem 0", color: "#2e7d32" }}>
          <i className="fa-solid fa-plus-circle"></i> Create New Dumping
          Location
        </h3>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {/* Dumping Info */}
          <input
            name="Title"
            placeholder="Location Title *"
            value={newDumping.Title}
            onChange={handleInputChange}
            style={{
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />

          <input
            name="maximum_capacity"
            type="number"
            placeholder="Maximum Capacity (optional)"
            value={newDumping.maximum_capacity}
            onChange={handleInputChange}
            style={{
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />

          <hr
            style={{
              margin: "0.5rem 0",
              border: "none",
              borderTop: "1px solid #ccc",
            }}
          />
          <p style={{ margin: 0, fontWeight: "bold", color: "#2e7d32" }}>
            Address Information
          </p>

          {/* Address Info */}
          <div>
            <p
              style={{
                margin: "0.5rem 0",
                fontWeight: "bold",
                color: "#2e7d32",
              }}
            >
              Click on the map to set coordinates
            </p>

            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "300px", width: "100%", borderRadius: "8px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker />
            </MapContainer>
          </div>
          <input
            name="street"
            placeholder="Street *"
            value={newDumping.street}
            onChange={handleInputChange}
            style={{
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(15px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <input
              name="city"
              placeholder="City *"
              value={newDumping.city}
              onChange={handleInputChange}
              style={{
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem",
              }}
            />

            <input
              name="region"
              placeholder="Region"
              value={newDumping.region}
              onChange={handleInputChange}
              style={{
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem",
              }}
            />
          </div>

          <input
            name="postal_code"
            placeholder="Postal Code"
            value={newDumping.postal_code}
            onChange={handleInputChange}
            style={{
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />

          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(15px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <input
              name="latitude"
              type="number"
              step="any"
              placeholder="Latitude"
              value={newDumping.latitude}
              onChange={handleInputChange}
              disabled
              style={{
                padding: "0.75rem",
                borderRadius: "6px",
                // border: "1px solid #ccc",
                fontSize: "1rem",
                flex: 1,
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                cursor: "not-allowed",
              }}
            />

            <input
              name="longitude"
              type="number"
              step="any"
              placeholder="Longitude"
              value={newDumping.longitude}
              onChange={handleInputChange}
              disabled
              style={{
                padding: "0.75rem",
                borderRadius: "6px",
                // border: "1px solid #ccc",
                fontSize: "1rem",
                flex: 1,
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                cursor: "not-allowed",
              }}
            />
          </div>

          <button
            onClick={createNewDumping}
            disabled={submittingNewDumping}
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: submittingNewDumping ? "#ccc" : "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: submittingNewDumping ? "wait" : "pointer",
              marginTop: "0.5rem",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            {submittingNewDumping ? "Creating..." : "Create Dumping Location"}
          </button>
          {error && (
            <p style={{ color: "red", fontSize: 18, textAlign: "center" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
