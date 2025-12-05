import React, { useState, useEffect, useContext } from "react";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
import { AuthContext } from "../../Components/AuthProvider";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/navbar.js";
import HeaderBox from "../../Components/HeaderBox.js";
import ReportModal from "../Modal/reportModal.js";
import "../../Styles/Page/companyReports.css";
import AlertSnackbar from "../../Components/Alert.js";

const CompanyReports = () => {
  const { clearAuth, accessToken, user_type, userData } =
    useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [snackbar, setsnackbar] = useState(false);

  // Modal state
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
      name: "Schedule",
      path: "/company/schedule",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-calendar-days fa-lg",
    },
    {
      name: "Pickups",
      path: "/company/pickups",
      color: "var(--gradient-orange)",
      glowColor: "#F97316",
      icon: "fa-solid fa-truck-pickup fa-lg",
    },
    {
      name: "Reports",
      path: "/company/reports",
      color: "var(--gradient-purple)",
      glowColor: "#A855F7",
      icon: "fa-solid fa-camera fa-lg",
    },
    {
      name: "Notifications",
      path: "/company/notifications",
      color: "var(--gradient-green-blue)",
      glowColor: "#10B981",
      icon: "fa-solid fa-bell fa-lg",
    },
  ];

  // Check authentication on mount
  useEffect(() => {
    if (!accessToken) {
      navigate("/Login", { replace: true });
    }
  }, [navigate, accessToken]);

  // useEffect(() => {
  //   if (user_type && user_type !== "company") {
  //     navigate(-1);
  //   }
  // }, [navigate]);

  // Fetch reports when authenticated
  useEffect(() => {
    if (accessToken) {
      fetchReports();
    }
  }, [accessToken]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      clearAuth();
      navigate("/Login");
    }
  };

  useEffect(() => {
    if (!accessToken) {
      navigate("/Login", { replace: true });
    }
  }, [accessToken, navigate]);

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
        setsnackbar(true);
        fetchReports();
        // Refresh modal if it's open and showing the same report
        if (isModalOpen && selectedReport?.report_id === reportId) {
          viewDetails(reportId, true);
        }
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // View report details
  const viewDetails = async (reportId, forceReload = false) => {
    try {
      // If cached and not forcing reload, just open modal
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
        console.log("Report data received:", data);
        console.log("User data:", data.user);
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

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalError(null);
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    if (filter === "all") return true;
    return report.status === filter;
  });

  const closesnackbar = () => {
    setsnackbar(false);
  };

  return (
    <div className="page">
      <Navbar links={links} onLogout={handleLogout} />

      <HeaderBox text="Report Dashboard" gradientColors={"--gradient-purple"} />

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

      {/* Reusable Modal Component */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={closeModal}
        report={selectedReport}
        loading={modalLoading}
        error={modalError}
        user={userData}
      />
      <AlertSnackbar
        open={snackbar}
        onClose={closesnackbar}
        message="Status updated successfully!"
        severity="success"
        autoHideDuration={3000}
      />
    </div>
  );
};

export default CompanyReports;
