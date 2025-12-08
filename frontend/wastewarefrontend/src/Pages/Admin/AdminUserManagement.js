import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Page/Admin/Adminusermanagement.css";
import AdminSidebar from "../../Components/AdminSidebar";
import AddUserModal from "../../Components/AddUserModal";
import EditUserModal from "../../Components/EditUserModal";
import { useFetchWithAuth } from "../../Components/fetchWithAuth.js";
import { AuthContext } from "../../Components/AuthProvider.js";
import AlertSnackbar from "../../Components/Alert.js";

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [snackbar, setsnackbar] = useState(false);
  const [message, setmessage] = useState("");
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

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
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(
          "https://wasteware-project-production.up.railway.app/api/auth/admin/users/",
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  // Handle checkbox selection
  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
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
      setSelectedUsers(users.map((u) => u.user_id));
    }
  };

  // Handle add user - open modal
  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  // Handle user added - add to list
  const handleUserAdded = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
    setsnackbar(true);
    setmessage("User added successfully!");
  };

  // Handle edit user - open modal
  const handleEditUser = (userId) => {
    const user = users.find((u) => u.user_id === userId);
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  // Handle user updated - update in list
  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u))
    );
    setsnackbar(true);
    setmessage("User updated successfully!");
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetchWithAuth(
        `https://wasteware-project-production.up.railway.app/api/auth/admin/users/${userId}/delete/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Remove user from list
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      setsnackbar(true);
      setmessage("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user");
    }
  };
  const closesnackbar = () => {
    setsnackbar(false);
    setmessage("");
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
                    <td className="col-name" style={{ textAlign: "center" }}>
                      {user.full_name}
                    </td>
                    <td className="col-email" style={{ textAlign: "center" }}>
                      {user.email}
                    </td>
                    <td className="col-phone" style={{ textAlign: "center" }}>
                      {user.phone_number}
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

export default AdminUserManagement;
