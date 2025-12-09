import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Page/Admin/Adminusermanagement.css";
import AdminSidebar from "../../Components/AdminSidebar";
import AddCompanyModal from "../../Components/AddCompanyModal";
import EditCompanyModal from "../../Components/EditCompanyModal";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
import { AuthContext } from "../../Components/AuthProvider.js";
import AlertSnackbar from "../../Components/Alert.js";

const AdminCompanyManagement = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [snackbar, setsnackbar] = useState(false);
  const [message, setmessage] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);

  const { clearAuth, accessToken, user_type, userData, isLoadingUser } =
    useContext(AuthContext);
  const fetchWithAuth = useFetchWithAuth();

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (user_type && user_type !== "admin") {
      navigate(-1);
    }
  }, [user_type, navigate]);

  useEffect(() => {
    fetchCompanies();
  }, [navigate]);

  const fetchCompanies = async () => {
    try {
      const response = await fetchWithAuth(
        "https://wasteware-project-production.up.railway.app/api/auth/admin/companies/",
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }

      const data = await response.json();
      setCompanies(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Failed to load companies");
      setLoading(false);
    }
  };

  // ========================================
  // HANDLE CHECKBOX SELECTION
  // ========================================
  const handleSelectCompany = (companyId) => {
    setSelectedCompanies((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter((id) => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map((c) => c.company_id));
    }
  };

  // ========================================
  // HANDLE ADD COMPANY
  // ========================================
  const handleAddCompany = () => {
    setIsAddModalOpen(true);
  };

  const handleCompanyAdded = (newCompany) => {
    // Add new company to the list
    setCompanies((prev) => [newCompany, ...prev]);
    setsnackbar(true);
    setmessage("Company Added Successfully!");
  };

  // ========================================
  // HANDLE EDIT COMPANY
  // ========================================
  const handleEditCompany = (companyId) => {
    const company = companies.find((c) => c.company_id === companyId);
    setCompanyToEdit(company);
    setIsEditModalOpen(true);
  };

  const handleCompanyUpdated = (updatedCompany) => {
    // Update company in the list
    setCompanies((prev) =>
      prev.map((c) =>
        c.company_id === updatedCompany.company_id ? updatedCompany : c
      )
    );
    setsnackbar(true);
    setmessage("Company Updated Successfully!");
  };

  // ========================================
  // HANDLE DELETE COMPANY
  // ========================================
  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm("Are you sure you want to delete this company?")) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetchWithAuth(
        `https://wasteware-project-production.up.railway.app/api/auth/admin/companies/${companyId}/delete/`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete company");
      }

      // Remove company from list
      setCompanies((prev) => prev.filter((c) => c.company_id !== companyId));
      // alert("Company deleted successfully!");
      setsnackbar(true);
      setmessage("Company deleted successfully!");
    } catch (err) {
      console.error("Error deleting company:", err);
      alert("Failed to delete company");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-page">{error}</div>;
  }

  const closesnackbar = () => {
    setsnackbar(false);
    setmessage("");
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main-content">
        {/* Header */}
        <div className="admin-header">
          <h1>Company Management</h1>
        </div>

        {/* Content */}
        <div className="admin-content">
          {/* Add Company Button */}
          <div className="content-actions">
            <button className="btn-add-user" onClick={handleAddCompany}>
              <i className="fa-solid fa-plus"></i>
              Add Company
            </button>
          </div>

          {/* Companies Table */}
          <div
            className="users-table-container"
            style={{ zIndex: 15, marginLeft: 220 }}
          >
            <table className="users-table">
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        companies.length > 0 &&
                        selectedCompanies.length === companies.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="col-icon">
                    <i className="fa-solid fa-building"></i>
                  </th>
                  <th className="col-icon">
                    <i className="fa-solid fa-envelope"></i>
                  </th>
                  <th className="col-icon">
                    <i className="fa-solid fa-phone"></i>
                  </th>

                  <th className="col-icon">
                    <i className="fa-solid fa-pen"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      No companies found. Add your first company!
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.company_id}>
                      <td className="col-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(
                            company.company_id
                          )}
                          onChange={() =>
                            handleSelectCompany(company.company_id)
                          }
                        />
                      </td>
                      <td className="col-name" style={{ textAlign: "center" }}>
                        {company.company_name}
                      </td>
                      <td className="col-email" style={{ textAlign: "center" }}>
                        {company.email}
                      </td>
                      <td className="col-phone" style={{ textAlign: "center" }}>
                        {company.phone_number || "N/A"}
                      </td>

                      <td
                        className="col-actions"
                        style={{ textAlign: "center" }}
                      >
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditCompany(company.company_id)}
                          title="Edit company"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() =>
                            handleDeleteCompany(company.company_id)
                          }
                          title="Delete company"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCompanyAdded={handleCompanyAdded}
      />

      <EditCompanyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        company={companyToEdit}
        onCompanyUpdated={handleCompanyUpdated}
      />
      <AlertSnackbar
        open={snackbar}
        onClose={closesnackbar}
        message={message}
        severity="success"
        autoHideDuration={4000}
      />
    </div>
  );
};

export default AdminCompanyManagement;
