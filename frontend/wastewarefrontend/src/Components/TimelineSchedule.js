import React from "react";
import "../Styles/Component/TimelineSchedule.css";

const TimelineSchedule = ({
  pickups,
  selectedPickupId,
  onSelectPickup,
  currentDate,
}) => {
  // Get current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour
    .toString()
    .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

  // Filter pickups for the selected date
  const datePickups = pickups.filter(
    (pickup) => pickup.schedule.pickup_date === currentDate
  );

  // Separate past and future pickups based on current time
  const pastPickups = [];
  const futurePickups = [];

  datePickups.forEach((pickup) => {
    const scheduleTime = pickup.schedule.start_time;
    if (scheduleTime < currentTimeStr) {
      pastPickups.push(pickup);
    } else {
      futurePickups.push(pickup);
    }
  });

  // Sort past pickups (most recent first)
  pastPickups.sort((a, b) =>
    b.schedule.start_time.localeCompare(a.schedule.start_time)
  );

  // Sort future pickups (earliest first)
  futurePickups.sort((a, b) =>
    a.schedule.start_time.localeCompare(b.schedule.start_time)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "In Progress":
        return "#F59E0B";
      default:
        return "#EF4444";
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const PickupCard = ({ pickup, isPast }) => {
    const isSelected = pickup.pickup_id === selectedPickupId;
    const statusColor = getStatusColor(pickup.status);

    return (
      <div
        className={`timeline-pickup-card ${isSelected ? "selected" : ""} ${
          isPast ? "past" : "future"
        }`}
        onClick={() => onSelectPickup(pickup)}
        style={{
          borderLeft: `4px solid ${statusColor}`,
        }}
      >
        <div className="pickup-time" style={{ color: statusColor }}>
          {formatTime(pickup.schedule.start_time)}
        </div>
        <div className="pickup-info">
          <div className="pickup-route">
            Route #{pickup.route.route_id} - {pickup.route.waste_type?.name}
          </div>
          <div className="pickup-driver">
            Driver: {pickup.route.driver?.first_name}{" "}
            {pickup.route.driver?.last_name}
          </div>
          <div className="pickup-status">
            <span
              className="status-badge"
              style={{ backgroundColor: statusColor }}
            >
              {pickup.status}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="selected-indicator">
            <i className="fa-solid fa-check"></i>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="timeline-schedule">
      {/* Past Pickups */}
      <div className="timeline-section past-section">
        {pastPickups.length > 0 ? (
          pastPickups.map((pickup) => (
            <PickupCard key={pickup.pickup_id} pickup={pickup} isPast={true} />
          ))
        ) : (
          <div className="no-pickups">No past pickups today</div>
        )}
      </div>

      {/* Current Time Indicator */}
      <div className="current-time-indicator">
        <div className="time-line"></div>
        <div className="time-badge">
          <i className="fa-solid fa-clock"></i>
          <span>{formatTime(currentTimeStr)}</span>
        </div>
        <div className="time-line"></div>
      </div>

      {/* Future Pickups */}
      <div className="timeline-section future-section">
        {futurePickups.length > 0 ? (
          futurePickups.map((pickup) => (
            <PickupCard key={pickup.pickup_id} pickup={pickup} isPast={false} />
          ))
        ) : (
          <div className="no-pickups">No upcoming pickups today</div>
        )}
      </div>
    </div>
  );
};

export default TimelineSchedule;
