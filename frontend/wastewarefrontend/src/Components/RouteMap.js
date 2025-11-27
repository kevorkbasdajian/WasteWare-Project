import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const createTruckIcon = () => {
  return L.divIcon({
    className: "custom-truck-icon",
    html: `
      <div style="
        background-color: #3b82f6;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <span style="font-size: 20px;">🚛</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Custom dumping location icon
const createDumpingIcon = (index, color) => {
  return L.divIcon({
    className: "custom-dumping-icon",
    html: `
      <div style="
        background-color: ${color};
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${index + 1}
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17.5, 17.5],
  });
};

// Company/start location icon
const createCompanyIcon = () => {
  return L.divIcon({
    className: "custom-company-icon",
    html: `
      <div style="
        background-color: #10b981;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <span style="font-size: 24px;">🏢</span>
      </div>
    `,
    iconSize: [45, 45],
    iconAnchor: [22.5, 22.5],
  });
};

const RoutingMachine = ({ waypoints, color, companyAddress }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length === 0) return;

    // Build the full waypoint list: company -> all dumpings -> back to company
    const allWaypoints = [];

    // Start from company
    if (companyAddress?.latitude && companyAddress?.longitude) {
      allWaypoints.push(
        L.latLng(
          parseFloat(companyAddress.latitude),
          parseFloat(companyAddress.longitude)
        )
      );
    }

    // Add all dumping locations
    waypoints.forEach((wp) => {
      allWaypoints.push(L.latLng(wp.lat, wp.lng));
    });

    // Return to company
    if (companyAddress?.latitude && companyAddress?.longitude) {
      allWaypoints.push(
        L.latLng(
          parseFloat(companyAddress.latitude),
          parseFloat(companyAddress.longitude)
        )
      );
    }

    // Ensure we have at least 2 waypoints
    if (allWaypoints.length < 2) return;

    // Clean up previous routing control
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.log("Error removing control:", e);
      }
      routingControlRef.current = null;
    }

    // Small delay to ensure map is ready
    const timeoutId = setTimeout(() => {
      try {
        routingControlRef.current = L.Routing.control({
          waypoints: allWaypoints,
          routeWhileDragging: true,
          showAlternatives: false,
          addWaypoints: true,
          lineOptions: {
            styles: [
              { color: "white", opacity: 0.8, weight: 8 },
              { color: color, opacity: 0.9, weight: 5 },
            ],
            extendToWaypoints: true,
            missingRouteTolerance: 0,
          },
          createMarker: function () {
            return null;
          },
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
            profile: "driving",
          }),
          fitSelectedRoutes: true,
        }).addTo(map);

        // Hide the routing instructions panel
        const routingContainer = routingControlRef.current.getContainer();
        if (routingContainer) {
          routingContainer.style.display = "none";
        }
      } catch (error) {
        console.error("Error creating routing control:", error);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (routingControlRef.current) {
        try {
          // Remove from map safely
          if (map && map.removeControl) {
            map.removeControl(routingControlRef.current);
          }
        } catch (e) {
          console.log("Cleanup error:", e);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, waypoints, color, companyAddress]);

  return null;
};

const RouteMap = ({ route, companyAddress, wasteTypeColor }) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Reset map ready state when route changes
    setMapReady(false);
    const timer = setTimeout(() => setMapReady(true), 300);
    return () => clearTimeout(timer);
  }, [route?.route_id]);

  if (!route || !route.route_stops) {
    return (
      <div
        style={{
          width: "100%",
          height: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          borderRadius: "1rem",
        }}
      >
        <p style={{ color: "#6b7280" }}>Select a route to view map</p>
      </div>
    );
  }

  // Get all dumping locations
  const dumpingLocations = route.route_stops
    .map((stop) => stop.dumping)
    .filter(
      (dump) => dump.address_detail?.latitude && dump.address_detail?.longitude
    );

  if (dumpingLocations.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          borderRadius: "1rem",
        }}
      >
        <p style={{ color: "#6b7280" }}>
          No valid locations found for this route
        </p>
      </div>
    );
  }

  // Prepare waypoints for routing
  const waypoints = dumpingLocations.map((dump) => ({
    lat: parseFloat(dump.address_detail.latitude),
    lng: parseFloat(dump.address_detail.longitude),
    title: dump.Title,
    dumpingId: dump.dumping_id,
  }));

  // Calculate center
  const centerLat =
    dumpingLocations.reduce(
      (sum, loc) => sum + parseFloat(loc.address_detail.latitude),
      0
    ) / dumpingLocations.length;
  const centerLng =
    dumpingLocations.reduce(
      (sum, loc) => sum + parseFloat(loc.address_detail.longitude),
      0
    ) / dumpingLocations.length;

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        borderRadius: "1rem",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {!mapReady && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                border: "4px solid #e5e7eb",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1rem",
              }}
            />
            <p style={{ color: "#6b7280" }}>Loading map...</p>
          </div>
        </div>
      )}

      <MapContainer
        key={`map-${route.route_id}`}
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Only render routing when map is ready */}
        {mapReady && (
          <RoutingMachine
            waypoints={waypoints}
            color={wasteTypeColor}
            companyAddress={companyAddress}
          />
        )}

        {/* Company/Start Location Marker */}
        {companyAddress?.latitude && companyAddress?.longitude && (
          <Marker
            position={[
              parseFloat(companyAddress.latitude),
              parseFloat(companyAddress.longitude),
            ]}
            icon={createCompanyIcon()}
          >
            <Popup>
              <strong>Company Location</strong>
              <br />
              Start Point
            </Popup>
          </Marker>
        )}

        {/* Dumping Location Markers */}
        {dumpingLocations.map((dump, index) => (
          <Marker
            key={dump.dumping_id}
            position={[
              parseFloat(dump.address_detail.latitude),
              parseFloat(dump.address_detail.longitude),
            ]}
            icon={createDumpingIcon(index, wasteTypeColor)}
          >
            <Popup>
              <strong>{dump.Title}</strong>
              <br />
              Stop #{index + 1}
              <br />
              Capacity: {dump.maximum_capacity} kg
              <br />
              Collected: {dump.collected_waste} kg
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Map Legend</div>
        <div className="legend-item">
          <span style={{ fontSize: "1.5rem" }}>🏢</span>
          <span>Company Start Point</span>
        </div>
        <div className="legend-item">
          <div
            style={{
              width: "2rem",
              height: "1.5rem",
              backgroundColor: wasteTypeColor,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "0.75rem",
              fontWeight: "bold",
            }}
          >
            1
          </div>
          <span>Dumping Locations</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: wasteTypeColor }}
          />
          <span>{route.waste_type?.name || "Route"}</span>
        </div>
        <div className="legend-item">
          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            💡 Drag waypoints to customize route
          </span>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
