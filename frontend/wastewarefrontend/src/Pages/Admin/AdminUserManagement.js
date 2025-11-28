import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Page/Admin/Adminusermanagement.css';
import AdminSidebar from '../../Components/AdminSidebar';
import AddUserModal from '../../Components/AddUserModal';
import EditUserModal from '../../Components/EditUserModal';

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  // ========================================
  // FETCH USERS DATA
  // ========================================
  useEffect(() => {
    // ============ MOCK DATA (CURRENTLY ACTIVE) ============
    const mockUsers = [
      {
        user_id: 1,
        full_name: 'Rafik Mikkawi',
        email: 'rafik@gmail.com',
        phone_number: '70082111',
        role: 'admin',
        account_status: 'Active',
        created_at: '2024-01-15T10:30:00Z',
        points_balance: 2500
      },
      {
        user_id: 2,
        full_name: 'Kevork Basdajian',
        email: 'Kevork@gmail.com',
        phone_number: '76627028',
        role: 'user',
        account_status: 'Active',
        created_at: '2024-02-20T14:22:00Z',
        points_balance: 1247
      },
      {
        user_id: 3,
        full_name: 'Christian Alam',
        email: 'Chris@gmail.com',
        phone_number: '71191268',
        role: 'user',
        account_status: 'Active',
        created_at: '2024-03-10T09:15:00Z',
        points_balance: 890
      },
      {
        user_id: 4,
        full_name: 'Sarah Johnson',
        email: 'sarah.j@gmail.com',
        phone_number: '70123456',
        role: 'user',
        account_status: 'Suspended',
        created_at: '2024-01-05T11:00:00Z',
        points_balance: 450
      },
      {
        user_id: 5,
        full_name: 'Mike Anderson',
        email: 'mike.a@gmail.com',
        phone_number: '76789012',
        role: 'user',
        account_status: 'Active',
        created_at: '2024-04-01T16:45:00Z',
        points_balance: 1580
      }
    ];

    setUsers(mockUsers);
    setLoading(false);
    // ======================================================

    // ============ REAL API FETCH (COMMENTED OUT - USE LATER) ============
    // const fetchUsers = async () => {
    //   try {
    //     const token = localStorage.getItem('access_token');
    //     
    //     if (!token) {
    //       navigate('/login');
    //       return;
    //     }
    //     
    //     const response = await fetch('http://localhost:8000/api/auth/admin/users/', {
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
    //       throw new Error('Failed to fetch users');
    //     }
    //     
    //     const data = await response.json();
    //     setUsers(data);
    //     setLoading(false);
    //     
    //   } catch (err) {
    //     console.error('Error fetching users:', err);
    //     setError('Failed to load users');
    //     setLoading(false);
    //   }
    // };
    // 
    // fetchUsers();
    // =====================================================================
  }, [navigate]);

  // Handle checkbox selection
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.user_id));
    }
  };

  // Handle add user - open modal
  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  // Handle user added - add to list
  const handleUserAdded = (newUser) => {
    setUsers(prev => [...prev, newUser]);
  };

  // Handle edit user - open modal
  const handleEditUser = (userId) => {
    const user = users.find(u => u.user_id === userId);
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  // Handle user updated - update in list
  const handleUserUpdated = (updatedUser) => {
    setUsers(prev => prev.map(u => 
      u.user_id === updatedUser.user_id ? updatedUser : u
    ));
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    // ============ MOCK DELETE (CURRENTLY ACTIVE) ============
    console.log('Mock: Deleting user', userId);
    setUsers(prev => prev.filter(u => u.user_id !== userId));
    alert('User deleted successfully!');
    // ========================================================

    // ============ REAL API DELETE (COMMENTED OUT - USE LATER) ============
    // try {
    //   const token = localStorage.getItem('access_token');
    //   
    //   const response = await fetch(`http://localhost:8000/api/auth/admin/users/${userId}/delete/`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //   });
    //   
    //   if (!response.ok) {
    //     throw new Error('Failed to delete user');
    //   }
    //   
    //   // Remove user from list
    //   setUsers(prev => prev.filter(u => u.user_id !== userId));
    //   alert('User deleted successfully!');
    //   
    // } catch (err) {
    //   console.error('Error deleting user:', err);
    //   alert('Failed to delete user');
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
          <h1>User Management</h1>
        </div>

        {/* Content */}
        <div className="admin-content">
          {/* Add User Button */}
          <div className="content-actions">
            <button className="btn-add-user" onClick={handleAddUser}>
              <i className="fa-solid fa-plus"></i>
              Add User
            </button>
          </div>

          {/* Users Table */}
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length}
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
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.user_id)}
                        onChange={() => handleSelectUser(user.user_id)}
                      />
                    </td>
                    <td className="col-name">{user.full_name}</td>
                    <td className="col-email">{user.email}</td>
                    <td className="col-phone">{user.phone_number}</td>
                    <td className="col-role">
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEditUser(user.user_id)}
                        title="Edit user"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteUser(user.user_id)}
                        title="Delete user"
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
      <AddUserModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={userToEdit}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};

export default AdminUserManagement;