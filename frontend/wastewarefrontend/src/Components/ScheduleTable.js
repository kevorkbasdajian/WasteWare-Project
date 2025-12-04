import React from "react";

const ScheduleTable = ({ schedules }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "#F97316",
      inProgress: "#BA11EE",
      completed: "#10B981",
    };
    return colors[status] || "#757575";
  };

  const getStatusDisplay = (status) => {
    const displays = {
      available: "Available",
      inProgress: "In Progress",
      completed: "Completed",
    };
    return displays[status] || status;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "white",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#0288D1",
              color: "white",
            }}
          >
            <th style={headerCellStyle}>Schedule ID</th>
            <th style={headerCellStyle}>Pickup Date</th>
            <th style={headerCellStyle}>Start Time</th>
            <th style={headerCellStyle}>End Time</th>
            <th style={headerCellStyle}>Duration</th>
            <th style={headerCellStyle}>Status</th>
            <th style={headerCellStyle}>Notes</th>
            <th style={headerCellStyle}>Created</th>
          </tr>
        </thead>
        <tbody>
          {schedules && schedules.length > 0 ? (
            schedules.map((schedule, index) => {
              // Calculate duration
              const startTime = schedule.start_time.split(":");
              const endTime = schedule.end_time.split(":");
              const startMinutes =
                parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
              const endMinutes =
                parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
              const durationMinutes = endMinutes - startMinutes;
              const hours = Math.floor(durationMinutes / 60);
              const minutes = durationMinutes % 60;
              const duration = `${hours}h ${minutes}m`;

              return (
                <tr
                  key={schedule.schedule_id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#f9fafb" : "white",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <td style={cellStyle}>
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#0288D1",
                      }}
                    >
                      #{schedule.schedule_id}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ fontWeight: "500" }}>
                      {formatDate(schedule.pickup_date)}
                    </span>
                  </td>
                  <td style={cellStyle}>{formatTime(schedule.start_time)}</td>
                  <td style={cellStyle}>{formatTime(schedule.end_time)}</td>
                  <td style={cellStyle}>
                    <span style={{ color: "#6B7280", fontWeight: "500" }}>
                      {duration}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        backgroundColor: getStatusColor(schedule.status),
                        color: "white",
                        display: "inline-block",
                      }}
                    >
                      {getStatusDisplay(schedule.status)}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        color: schedule.notes ? "#1F2937" : "#9CA3AF",
                        fontStyle: schedule.notes ? "normal" : "italic",
                      }}
                    >
                      {schedule.notes || "No notes"}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ color: "#6B7280", fontSize: "0.9rem" }}>
                      {formatDate(schedule.created_at)}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan="8"
                style={{
                  ...cellStyle,
                  textAlign: "center",
                  color: "#9CA3AF",
                  fontStyle: "italic",
                  padding: "2rem",
                }}
              >
                <i
                  className="fa-solid fa-calendar-xmark"
                  style={{
                    fontSize: "2rem",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                />
                No schedules available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const headerCellStyle = {
  padding: "16px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "0.95rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const cellStyle = {
  padding: "16px",
  textAlign: "left",
  fontSize: "0.95rem",
  color: "#1F2937",
};

export default ScheduleTable;
