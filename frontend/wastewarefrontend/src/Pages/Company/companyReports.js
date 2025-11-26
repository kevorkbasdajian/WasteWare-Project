import React, { useState, useEffect } from "react";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
import Navbar from "../../Components/navbar.js";
import "../../Styles/Page/companyReports.css";
import HeaderBox from "../../Components/HeaderBox.js";

const CompanyReports = () => {
  const fetchWithAuth = useFetchWithAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, reviewed, resolved

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

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
      color: "var(--gradient-clean-blue)",
      glowColor: "#3B82F6",
      icon: "fa-solid fa-map-location-dot fa-lg",
    },
    {
      name: "Reports",
      path: "/company/reports",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-camera fa-lg",
    },
    {
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: "fa-solid fa-clock fa-lg",
    },
    {
      name: "Notifications",
      path: "/company/notifications",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: "fa-solid fa-bell fa-lg",
    },
  ];

  // Fetch all reports (admin only)
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        "http://localhost:8000/api/reports/all/"
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        console.error("Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update report status
  const updateStatus = async (reportId, newStatus) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/reports/${reportId}/status/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        alert("Status updated successfully!");
        fetchReports(); // Refresh list
        // if modal open and the report is the same, refresh modal
        if (isModalOpen && selectedReport?.report_id === reportId) {
          viewDetails(reportId, true); // force refresh modal data
        }
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // View report details (fetches detail endpoint and opens modal)
  // pass `forceReload = false` to avoid re-fetching when not needed
  const viewDetails = async (reportId, forceReload = false) => {
    try {
      // If we already have the selectedReport cached and it's the same, just open
      if (
        !forceReload &&
        selectedReport &&
        selectedReport.report_id === reportId
      ) {
        setIsModalOpen(true);
        setModalError(null);
        return;
      }

      setModalLoading(true);
      setModalError(null);

      const response = await fetchWithAuth(
        `http://localhost:8000/api/reports/${reportId}/`
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data);
        setIsModalOpen(true);
      } else {
        setModalError("Failed to load report details");
        console.error("Failed to fetch report details", response.status);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      setModalError("An error occurred while fetching details");
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal helper
  const closeModal = () => {
    setIsModalOpen(false);
    // keep selectedReport if you want to reuse; uncomment to clear it:
    // setSelectedReport(null);
    setModalError(null);
  };

  // close on ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  // Filter reports
  const filteredReports = reports.filter((report) => {
    if (filter === "all") return true;
    return report.status === filter;
  });

  return (
    <div className="page">
      <Navbar links={links} />

      <HeaderBox
        text="Report Dashboard"
        gradientColors={["#3949AB", "#5C6BC0"]}
      />

      <div className="company-reports-container">
        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({reports.length})
          </button>
          <button
            className={`filter-tab ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending ({reports.filter((r) => r.status === "pending").length})
          </button>
          <button
            className={`filter-tab ${filter === "reviewed" ? "active" : ""}`}
            onClick={() => setFilter("reviewed")}
          >
            Reviewed ({reports.filter((r) => r.status === "reviewed").length})
          </button>
          <button
            className={`filter-tab ${filter === "resolved" ? "active" : ""}`}
            onClick={() => setFilter("resolved")}
          >
            Resolved ({reports.filter((r) => r.status === "resolved").length})
          </button>
        </div>

        {/* Reports Table */}
        <div className="reports-table-container">
          {loading ? (
            <div className="loading-spinner-container">
              <i className="fa-solid fa-spinner fa-spin fa-3x"></i>
              <p>Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="no-reports">
              <i className="fa-solid fa-inbox fa-3x"></i>
              <p>No reports found</p>
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.report_id}>
                    <td>
                      <span className="report-id">#{report.report_id}</span>
                    </td>
                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                    <td className="report-title-cell">{report.title}</td>
                    <td>
                      <span className="type-badge">
                        {report.type_display || report.type_of_report}
                      </span>
                    </td>
                    <td>
                      <select
                        className={`status-select status-${report.status}`}
                        value={report.status}
                        onChange={(e) =>
                          updateStatus(report.report_id, e.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="details-btn"
                        onClick={() => viewDetails(report.report_id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            // close when clicking overlay (but not when clicking inside modal)
            if (e.target.classList.contains("modal-overlay")) closeModal();
          }}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Report details"
          >
            <header className="modal-header">
              <h2>
                Report Details{" "}
                {selectedReport ? (
                  <span style={{ fontSize: "0.85rem", color: "#666" }}>
                    #{selectedReport.report_id}
                  </span>
                ) : null}
              </h2>
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                &times;
              </button>
            </header>

            <div className="modal-body">
              {modalLoading ? (
                <div className="loading-spinner-container">
                  <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
                  <p>Loading...</p>
                </div>
              ) : modalError ? (
                <div className="no-reports">
                  <p>{modalError}</p>
                </div>
              ) : selectedReport ? (
                <div className="report-detail-grid">
                  <div className="detail-row">
                    <strong>Title:</strong> <span>{selectedReport.title}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Report ID:</strong>{" "}
                    <span>#{selectedReport.report_id}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Type:</strong>{" "}
                    <span>
                      {selectedReport.type_display ||
                        selectedReport.type_of_report}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong>{" "}
                    <span>
                      {selectedReport.status_display || selectedReport.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Created At:</strong>{" "}
                    <span>
                      {new Date(selectedReport.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedReport.resolved_at && (
                    <div className="detail-row">
                      <strong>Resolved At:</strong>{" "}
                      <span>
                        {new Date(selectedReport.resolved_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <strong>Description:</strong>{" "}
                    <div className="detail-rich">
                      {selectedReport.description || "No description"}
                    </div>
                  </div>

                  {/* Example for user / location / images - adjust to your payload */}
                  {selectedReport.user && (
                    <div className="detail-row">
                      <strong>Reported By:</strong>{" "}
                      <span>
                        {selectedReport.user.full_name ||
                          selectedReport.user.email ||
                          selectedReport.user.user_id}
                      </span>
                    </div>
                  )}

                  {selectedReport.location && (
                    <div className="detail-row">
                      <strong>Location:</strong>{" "}
                      <span>{selectedReport.location}</span>
                    </div>
                  )}

                  {selectedReport.images &&
                    selectedReport.images.length > 0 && (
                      <div className="detail-row">
                        <strong>Images:</strong>
                        <div className="detail-images">
                          {selectedReport.images.map((imgUrl, idx) => (
                            <img key={idx} src={imgUrl} alt={`report-${idx}`} />
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Raw JSON fallback (helpful during dev) */}
                  <div className="detail-row">
                    <strong>Raw:</strong>
                    <pre style={{ maxHeight: 200, overflow: "auto" }}>
                      {JSON.stringify(selectedReport, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="no-reports">
                  <p>No details available</p>
                </div>
              )}
            </div>

            <footer className="modal-footer">
              <button className="details-btn" onClick={closeModal}>
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyReports;
