import React from "react";
import L from "leaflet";

// Custom Truck Icon for the map
export const createTruckIcon = () => {
  return L.divIcon({
    className: "custom-truck-icon",
    html: `
      <div style="
        background-color: #3b82f6;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      ">
        <span style="font-size: 24px;">🚛</span>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    iconSize: [45, 45],
    iconAnchor: [22.5, 22.5],
  });
};

export const createCompanyIcon = () => {
  return L.divIcon({
    className: "custom-company-icon",
    html: `
      <div style="
        background-color: #10b981;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        <span style="font-size: 28px;">🏢</span>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};

export const createDumpingIcon = (index, color, isPassed) => {
  return L.divIcon({
    className: "custom-dumping-icon",
    html: `
      <div style="
        background-color: ${isPassed ? "#10b981" : color};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        color: white;
        font-weight: bold;
        font-size: 16px;
        ${isPassed ? "opacity: 0.7;" : ""}
      ">
        ${isPassed ? "✓" : index + 1}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};
