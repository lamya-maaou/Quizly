import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TeacherModules.css";
import { useNavigate } from "react-router-dom";

const TeacherModules = () => {
  const [modules, setModules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleName, setModuleName] = useState("");
  const [currentModule, setCurrentModule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch modules function remains the same
  const fetchModules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/teacher/modules/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setModules(response.data);
    } catch (error) {
      console.error("Error fetching modules:", error);
      setError("Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  // Create module function remains the same
  const handleCreateModule = async () => {
    if (!moduleName.trim()) {
      alert("Subject name cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post(
        "http://localhost:8000/api/teacher/modules/create/",
        { name: moduleName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      await fetchModules();
      setShowModal(false);
      setModuleName("");
    } catch (error) {
      console.error("Error creating subject:", error.response?.data || error);
      setError(error.response?.data?.error || "Failed to create subject");
    } finally {
      setIsLoading(false);
    }
  };

  // New function to handle edit
  const handleEditModule = async () => {
    if (!moduleName.trim()) {
      alert("Subject name cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Sending update request for subject:", currentModule.id);
      console.log("New name:", moduleName);

      const response = await axios.put(
        `http://localhost:8000/api/teacher/modules/${currentModule.id}/update/`,
        { name: moduleName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Update response:", response.data);

      await fetchModules();
      setShowEditModal(false);
      setModuleName("");
      setCurrentModule(null);
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response data:", error.response?.data);
      setError(error.response?.data?.error || "Failed to update subject");
    } finally {
      setIsLoading(false);
    }
  };

  // New function to handle delete
  const handleDeleteModule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(
        `http://localhost:8000/api/teacher/modules/${currentModule.id}/delete/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      await fetchModules();
      setShowDeleteModal(false);
      setCurrentModule(null);
    } catch (error) {
      console.error("Error deleting subject:", error.response?.data || error);
      setError(error.response?.data?.error || "Failed to delete subject");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open edit modal
  const openEditModal = (module) => {
    setCurrentModule(module);
    setModuleName(module.name);
    setShowEditModal(true);
  };

  // Function to open delete modal
  const openDeleteModal = (module) => {
    setCurrentModule(module);
    setShowDeleteModal(true);
  };

  // Logout function remains the same
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Prevent event bubbling when clicking on module actions
  const handleModuleActionClick = (e, module, action) => {
    e.stopPropagation();
    if (action === "edit") {
      openEditModal(module);
    } else if (action === "delete") {
      openDeleteModal(module);
    }
  };

  return (
    <div className="teacher-modules">
      {/* Navbar - remains the same */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">QUIZLY</span>
        </div>
        <div className="navbar-right">
          <button
            className="add-button-navbar"
            onClick={() => setShowModal(true)}
            disabled={isLoading}
          >
            {isLoading ? "..." : "+"}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Modules List */}
      <div className="modules-container">
        <h2 className="modules-title">My Subjects</h2>

        {isLoading && !modules.length ? (
          <p>Loading subjects...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : modules.length === 0 ? (
          <div className="empty-state">
            <p className="no-modules">No subjects yet.</p>
            <button
              className="create-first-module"
              onClick={() => setShowModal(true)}
            >
              Create your first subject
            </button>
          </div>
        ) : (
          <div className="modules-grid">
            {modules.map((module) => (
              <div
                className="module-card"
                key={module.id}
                onClick={() => navigate(`/teacher/modules/${module.id}`)}
              >
                <div className="module-header">
                  <h3>{module.name}</h3>
                  <div className="module-actions">
                    <button
                      className="edit-btn"
                      onClick={(e) =>
                        handleModuleActionClick(e, module, "edit")
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) =>
                        handleModuleActionClick(e, module, "delete")
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p>
                  Created: {new Date(module.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal - remains the same */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New subject</h3>
            {error && <p className="modal-error">{error}</p>}
            <input
              type="text"
              placeholder="Subject Name"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              disabled={isLoading}
            />
            <div className="modal-buttons">
              <button
                onClick={handleCreateModule}
                disabled={isLoading || !moduleName.trim()}
              >
                {isLoading ? "Creating..." : "Create"}
              </button>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Subject</h3>
            {error && <p className="modal-error">{error}</p>}
            <input
              type="text"
              placeholder="Subject Name"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              disabled={isLoading}
            />
            <div className="modal-buttons">
              <button
                onClick={handleEditModule}
                disabled={isLoading || !moduleName.trim()}
              >
                {isLoading ? "Updating..." : "Update"}
              </button>
              <button
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Subject</h3>
            {error && <p className="modal-error">{error}</p>}
            <p>Are you sure you want to delete "{currentModule?.name}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-buttons">
              <button
                className="delete-confirm-btn"
                onClick={handleDeleteModule}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                className="close-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherModules;
