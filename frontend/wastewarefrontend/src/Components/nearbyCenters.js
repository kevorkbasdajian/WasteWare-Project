import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const NearbyCentersMap = ({
  centers,
  userLocation,
  onCenterSelect,
  selectedCenter,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      // Default center (Beirut if no user location)
      const defaultCenter = userLocation || [33.8938, 35.5018];

      mapInstanceRef.current = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    } else {
      // If map already exists and user location is now available, recenter
      mapInstanceRef.current.setView(userLocation, 13);
    }

    return () => {
      // Cleanup markers when component unmounts
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <!-- Outer glow ring -->
            <div style="
              position: absolute;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color: rgba(59, 130, 246, 0.2);
              animation: pulse-ring 2s infinite;
            "></div>
            <!-- Marker pin -->
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50% 50% 50% 0;
              background-color: #3b82f6;
              border: 3px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fa-solid fa-location-dot" style="
                font-size: 12px;
                color: white;
                transform: rotate(45deg);
              "></i>
            </div>
          </div>
          <style>
            @keyframes pulse-ring {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(1.5); opacity: 0; }
            }
          </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 35],
        popupAnchor: [0, -35],
      });

      const userMarker = L.marker(userLocation, { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(
          `<div style="text-align: center;">
            <strong style="color: #3b82f6;">📍 Your Location</strong>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              ${userLocation[0].toFixed(5)}, ${userLocation[1].toFixed(5)}
            </p>
          </div>`,
          { maxWidth: 200 }
        );

      markersRef.current.push(userMarker);

      // Add 5km radius circle
      const radiusCircle = L.circle(userLocation, {
        radius: 10000, // 10km in meters
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "5, 10",
      }).addTo(mapInstanceRef.current);

      markersRef.current.push(radiusCircle);
    }

    // Add center markers
    centers.forEach((center, index) => {
      if (!center.latitude || !center.longitude) return;

      // Create custom icon based on waste type
      const markerColor = getWasteTypeColor(center.type);
      const icon = L.divIcon({
        className: "center-marker",
        html: `
          <div style="
            background-color: ${markerColor};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            ${
              selectedCenter?.id === center.id
                ? "transform: scale(1.2); border-color: #fbbf24;"
                : ""
            }
          ">
            <i class="fa-solid fa-recycle" style="font-size: 14px;"></i>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
      });

      const marker = L.marker([center.latitude, center.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(
          `
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: ${markerColor};">${
            center.name
          }</h4>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Type:</strong> ${
              center.type
            }</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Distance:</strong> ${
              center.distance
            }</p>
            ${
              center.address
                ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">${center.address}</p>`
                : ""
            }
            ${
              center.capacity
                ? `
              <div style="margin-top: 8px;">
                <div style="background: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
                  <div style="background: ${markerColor}; height: 100%; width: ${
                    (center.collected / center.capacity) * 100
                  }%;"></div>
                </div>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">${
                  center.collected
                }/${center.capacity} tons</p>
              </div>
            `
                : ""
            }
          </div>
          `,
          { maxWidth: 250 }
        );

      // Add click event to select center
      marker.on("click", () => {
        if (onCenterSelect) {
          onCenterSelect(center);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    } else if (userLocation) {
      mapInstanceRef.current.setView(userLocation, 13);
    }
  }, [centers, userLocation, selectedCenter, onCenterSelect]);

  // Highlight selected center
  useEffect(() => {
    if (!selectedCenter || !mapInstanceRef.current) return;

    // Find and open popup for selected center
    markersRef.current.forEach((marker) => {
      const markerLatLng = marker.getLatLng();
      if (
        selectedCenter.latitude === markerLatLng.lat &&
        selectedCenter.longitude === markerLatLng.lng
      ) {
        marker.openPopup();
        mapInstanceRef.current.setView(
          [selectedCenter.latitude, selectedCenter.longitude],
          15,
          {
            animate: true,
          }
        );
      }
    });
  }, [selectedCenter]);

  const getWasteTypeColor = (type) => {
    const colors = {
      Chemical: "#10b981",
      Hazardous: "#ef4444",
      Organic: "#f59e0b",
      Industrial: "#8b5cf6",
      Liquid: "#3b82f6",
      Recycling: "#10b981",
      "Mixed Waste": "#64748b",
      "Waste Collection": "#64748b",
    };
    return colors[type] || "#64748b";
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default NearbyCentersMap;
