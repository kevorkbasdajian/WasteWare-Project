import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Page/Admin/Adminusermanagement.css';
import AdminSidebar from '../../Components/AdminSidebar';
import AddCompanyModal from '../../Components/AddCompanyModal';
import EditCompanyModal from '../../Components/EditCompanyModal';

const AdminCompanyManagement = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);

  // ========================================
  // FETCH COMPANIES DATA
  // ========================================
  useEffect(() => {
    // ============ MOCK DATA (CURRENTLY ACTIVE) ============
    const mockCompanies = [
      {
        user_id: 1,
        company_name: 'Mahmoud Hajj',
        email: 'company@gmail.com',
        phone_number: '12345678',
        role: 'waste manager',
        account_status: 'Active',
        created_at: '2024-01-10T08:00:00Z',
      },
      {
        user_id: 2,
        company_name: 'Green Solutions Ltd',
        email: 'green@solutions.com',
        phone_number: '76543210',
        role: 'waste manager',
        account_status: 'Active',
        created_at: '2024-02-15T09:30:00Z',
      },
      {
        user_id: 3,
        company_name: 'EcoWaste Services',
        email: 'contact@ecowaste.com',
        phone_number: '71234567',
        role: 'waste manager',
        account_status: 'Suspended',
        created_at: '2024-03-20T11:15:00Z',
      }
    ];

    setCompanies(mockCompanies);
    setLoading(false);
    // ======================================================

    // ============ REAL API FETCH (COMMENTED OUT - USE LATER) ============
    // const fetchCompanies = async () => {
    //   try {
    //     const token = localStorage.getItem('access_token');
    //     
    //     if (!token) {
    //       navigate('/login');
    //       return;
    //     }
    //     
    //     const response = await fetch('http://localhost:8000/api/auth/admin/companies/', {
    //       method: 'GET',
    //       headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //       },
    //     });
    //     
    //     if (!response.ok) {
    //       if (response.status === 401) {
    //         localStorage.removeItem('access_token');
    //         navigate('/login');
    //         return;
    //       }
    //       throw new Error('Failed to fetch companies');
    //     }
    //     
    //     const data = await response.json();
    //     setCompanies(data);
    //     setLoading(false);
    //     
    //   } catch (err) {
    //     console.error('Error fetching companies:', err);
    //     setError('Failed to load companies');
    //     setLoading(false);
    //   }
    // };
    // 
    // fetchCompanies();
    // =====================================================================
  }, [navigate]);

  // Handle checkbox selection
  const handleSelectCompany = (companyId) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(c => c.user_id));
    }
  };

  // Handle add company - open modal
  const handleAddCompany = () => {
    setIsAddModalOpen(true);
  };

  // Handle company added - add to list
  const handleCompanyAdded = (newCompany) => {
    setCompanies(prev => [...prev, newCompany]);
  };

  // Handle edit company - open modal
  const handleEditCompany = (companyId) => {
    const company = companies.find(c => c.user_id === companyId);
    setCompanyToEdit(company);
    setIsEditModalOpen(true);
  };

  // Handle company updated - update in list
  const handleCompanyUpdated = (updatedCompany) => {
    setCompanies(prev => prev.map(c => 
      c.user_id === updatedCompany.user_id ? updatedCompany : c
    ));
  };

  // Handle delete company
  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) {
      return;
    }

    // ============ MOCK DELETE (CURRENTLY ACTIVE) ============
    console.log('Mock: Deleting company', companyId);
    setCompanies(prev => prev.filter(c => c.user_id !== companyId));
    alert('Company deleted successfully!');
    // ========================================================

    // ============ REAL API DELETE (COMMENTED OUT - USE LATER) ============
    // try {
    //   const token = localStorage.getItem('access_token');
    //   
    //   const response = await fetch(`http://localhost:8000/api/auth/admin/companies/${companyId}/delete/`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //   });
    //   
    //   if (!response.ok) {
    //     throw new Error('Failed to delete company');
    //   }
    //   
    //   // Remove company from list
    //   setCompanies(prev => prev.filter(c => c.user_id !== companyId));
    //   alert('Company deleted successfully!');
    //   
    // } catch (err) {
    //   console.error('Error deleting company:', err);
    //   alert('Failed to delete company');
    // }
    // ======================================================================
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-page">{error}</div>;
  }

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
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCompanies.length === companies.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="col-icon">
                    <i className="fa-solid fa-user"></i>
                  </th>
                  <th className="col-icon">
                    <i className="fa-solid fa-envelope"></i>
                  </th>
                  <th className="col-icon">
                    <i className="fa-solid fa-phone"></i>
                  </th>
                  <th className="col-icon">
                    <i className="fa-solid fa-users"></i>
                  </th>
                  <th className="col-icon">
                    <i className="fa-solid fa-pen"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.user_id}>
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company.user_id)}
                        onChange={() => handleSelectCompany(company.user_id)}
                      />
                    </td>
                    <td className="col-name">{company.company_name}</td>
                    <td className="col-email">{company.email}</td>
                    <td className="col-phone">{company.phone_number}</td>
                    <td className="col-role">
                      <span className="role-badge user">
                        {company.role}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEditCompany(company.user_id)}
                        title="Edit company"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteCompany(company.user_id)}
                        title="Delete company"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
};

export default AdminCompanyManagement;