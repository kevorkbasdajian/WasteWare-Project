import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import {
  createTruckIcon,
  createCompanyIcon,
  createDumpingIcon,
} from "./TruckIcon";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const RoutingMachine = ({ waypoints, color }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length === 0) return;

    // Clean up previous routing control
    if (routingControlRef.current) {
      try {
        const control = routingControlRef.current;
        control.off();
        control.getPlan().setWaypoints([]);
        if (map && map.removeControl) {
          map.removeControl(control);
        }
      } catch (e) {
        console.log("Error removing control:", e);
      }
      routingControlRef.current = null;
    }

    // Build waypoints array
    const allWaypoints = waypoints.map((wp) => L.latLng(wp.lat, wp.lng));

    if (allWaypoints.length < 2) return;

    const timeoutId = setTimeout(() => {
      if (!mountedRef.current) return;

      try {
        const routingControl = L.Routing.control({
          waypoints: allWaypoints,
          routeWhileDragging: false,
          showAlternatives: false,
          addWaypoints: false,
          draggableWaypoints: false,
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
            timeout: 5000,
          }),
          fitSelectedRoutes: true,
        });

        routingControl.on("routingerror", function (e) {
          console.log("Routing error:", e);
        });

        if (mountedRef.current && map) {
          routingControl.addTo(map);
          routingControlRef.current = routingControl;

          const routingContainer = routingControl.getContainer();
          if (routingContainer) {
            routingContainer.style.display = "none";
          }
        }
      } catch (error) {
        console.error("Error creating routing control:", error);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      if (routingControlRef.current) {
        try {
          const control = routingControlRef.current;
          control.off();
          if (control.getPlan) {
            control.getPlan().setWaypoints([]);
          }
          if (map && map.removeControl) {
            map.removeControl(control);
          }
        } catch (e) {
          console.log("Cleanup error:", e);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, waypoints, color]);

  return null;
};

const ClientRouteMap = ({ pickup, wasteTypeColor }) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setMapReady(false);
    setMapKey((prev) => prev + 1);
    const timer = setTimeout(() => setMapReady(true), 300);
    return () => clearTimeout(timer);
  }, [pickup?.pickup_id]);

  if (!pickup || !pickup.route || !pickup.route.route_stops) {
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
        <p style={{ color: "#6b7280" }}>Select a pickup to view map</p>
      </div>
    );
  }

  const route = pickup.route;
  const companyLocation = { lat: 33.8938, lng: 35.5018 };

  // Get dumping locations
  const dumpingLocations = route.route_stops
    .filter(
      (stop) =>
        stop.dumping?.address_detail?.latitude &&
        stop.dumping?.address_detail?.longitude
    )
    .map((stop) => ({
      lat: parseFloat(stop.dumping.address_detail.latitude),
      lng: parseFloat(stop.dumping.address_detail.longitude),
      title: stop.dumping.Title,
      dumpingId: stop.dumping.dumping_id,
      isPassed: stop.has_passed,
      capacity: stop.dumping.maximum_capacity,
    }));

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
          No valid locations found for this pickup
        </p>
      </div>
    );
  }

  // Build waypoints: company -> dumpings -> company
  const waypoints = [companyLocation, ...dumpingLocations, companyLocation];

  // Calculate center
  const centerLat =
    dumpingLocations.reduce((sum, loc) => sum + loc.lat, 0) /
    dumpingLocations.length;
  const centerLng =
    dumpingLocations.reduce((sum, loc) => sum + loc.lng, 0) /
    dumpingLocations.length;

  // Get truck location
  const truckLocation = pickup.live_location
    ? {
        lat: parseFloat(pickup.live_location.latitude),
        lng: parseFloat(pickup.live_location.longitude),
      }
    : companyLocation;

  return (
    <div
      style={{
        width: "100%",
        height: "550px",
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
        key={`map-${pickup.pickup_id}-${mapKey}`}
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

        {mapReady && (
          <RoutingMachine waypoints={waypoints} color={wasteTypeColor} />
        )}

        {/* Company Location Marker */}
        <Marker
          position={[companyLocation.lat, companyLocation.lng]}
          icon={createCompanyIcon()}
        >
          <Popup>
            <strong>Company Location</strong>
            <br />
            Start/End Point
          </Popup>
        </Marker>

        {/* Truck Marker */}
        <Marker
          position={[truckLocation.lat, truckLocation.lng]}
          icon={createTruckIcon()}
        >
          <Popup>
            <strong>Truck Location</strong>
            <br />
            Status: {pickup.status}
            <br />
            Weight Collected: {pickup.weight_collected || 0} kg
          </Popup>
        </Marker>

        {/* Dumping Location Markers */}
        {dumpingLocations.map((dump, index) => (
          <Marker
            key={dump.dumpingId}
            position={[dump.lat, dump.lng]}
            icon={createDumpingIcon(index, wasteTypeColor, dump.isPassed)}
          >
            <Popup>
              <strong>{dump.title}</strong>
              <br />
              Stop #{index + 1}
              <br />
              Status: {dump.isPassed ? "Completed ✓" : "Pending"}
              <br />
              Capacity: {dump.capacity} kg
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Info Panel */}
      {/* Map Info Panel */}
      <div className="map-info-panel">
        <div className="map-info-title">Pickup Status</div>
        <div className="map-info-content">
          <div>
            <strong>Status:</strong> {pickup.status}
          </div>
          <div>
            <strong>Weight:</strong> {pickup.weight_collected || 0} kg
          </div>
          <div>
            <strong>Progress:</strong>{" "}
            {pickup.progress_percentage?.toFixed(1) || 0}%
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="map-legend-title">Legend</div>
        <div className="map-legend-items">
          <div className="map-legend-item">
            <span style={{ fontSize: "18px" }}>🏢</span>
            <span>Company</span>
          </div>
          <div className="map-legend-item">
            <span style={{ fontSize: "18px" }}>🚛</span>
            <span>Truck</span>
          </div>
          <div className="map-legend-item">
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: wasteTypeColor,
                border: "2px solid white",
              }}
            />
            <span>Pending Stop</span>
          </div>
          <div className="map-legend-item">
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                border: "2px solid white",
              }}
            />
            <span>Completed Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientRouteMap;
