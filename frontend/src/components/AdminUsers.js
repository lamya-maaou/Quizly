import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import UserFormModal from "./UserFormModal";
import BackToDashboardButton from "./BackToDashboardButton";
import "./AdminUsers.css";
import "./AdminPage.css";

const API_BASE = "http://localhost:8000/api/";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}admin/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError(
        "Error loading users: " + (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(
        `${API_BASE}admin/users/${userId}/`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      setError(
        "Error updating user status: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${API_BASE}admin/users/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchUsers();
      } catch (err) {
        setError(
          "Error deleting user: " + (err.response?.data?.detail || err.message)
        );
      }
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSubmitUser = async (formData) => {
    try {
      if (selectedUser) {
        // Edit existing user
        await axios.patch(
          `${API_BASE}admin/users/${selectedUser.id}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new user
        await axios.post(`${API_BASE}admin/users/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(
        `Error ${selectedUser ? "updating" : "creating"} user: ` +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="admin-users-loading">Loading users...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header users-header-flex">
        <BackToDashboardButton />
        <h1 className="admin-users-title">User Management</h1>
        <button className="create-user-button" onClick={handleCreateUser}>
          <FaPlus /> Create User
        </button>
      </div>
      <div className="admin-page-content">
        <div className="admin-users-filters">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="role-filters">
            <button
              className={`role-filter ${roleFilter === "all" ? "active" : ""}`}
              onClick={() => handleRoleFilter("all")}
            >
              All
            </button>
            <button
              className={`role-filter ${
                roleFilter === "teacher" ? "active" : ""
              }`}
              onClick={() => handleRoleFilter("teacher")}
            >
              <FaChalkboardTeacher /> Teachers
            </button>
            <button
              className={`role-filter ${
                roleFilter === "student" ? "active" : ""
              }`}
              onClick={() => handleRoleFilter("student")}
            >
              <FaUserGraduate /> Students
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === "teacher" ? (
                        <FaChalkboardTeacher />
                      ) : (
                        <FaUserGraduate />
                      )}
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.is_active ? "active" : "inactive"
                      }`}
                    >
                      {user.is_active ? <FaCheck /> : <FaTimes />}
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-button edit"
                        onClick={() => handleEditUser(user)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-button toggle"
                        onClick={() =>
                          handleToggleUserStatus(user.id, user.is_active)
                        }
                      >
                        {user.is_active ? <FaTimes /> : <FaCheck />}
                      </button>
                      <button
                        className="action-button delete"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <UserFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitUser}
          user={selectedUser}
        />
      </div>
    </div>
  );
};

export default AdminUsers;
