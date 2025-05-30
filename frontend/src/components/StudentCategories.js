import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentCategories.css";
import { useNavigate } from "react-router-dom";

const StudentCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleName, setmoduleName] = useState("");
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fonction pour charger les catégories
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/student/categories/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fonction pour créer une nouvelle catégorie
  const handleCreateCategory = async () => {
    if (!moduleName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/student/categories/create/",
        { name: moduleName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      setCategories([...categories, response.data]);
      setShowModal(false);
      setmoduleName("");
    } catch (error) {
      console.error("Error creating category:", error.response?.data || error);
      setError(error.response?.data?.error || "Failed to create category");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour modifier une catégorie
  const handleEditCategory = async () => {
    if (!moduleName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.put(
        `http://localhost:8000/api/student/categories/${currentCategory.id}/update/`,
        { name: moduleName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      await fetchCategories();
      setShowEditModal(false);
      setmoduleName("");
      setCurrentCategory(null);
    } catch (error) {
      console.error("Error updating category:", error.response?.data || error);
      setError(error.response?.data?.error || "Failed to update category");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour supprimer une catégorie
  const handleDeleteCategory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(
        `http://localhost:8000/api/student/categories/${currentCategory.id}/delete/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      await fetchCategories();
      setShowDeleteModal(false);
      setCurrentCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error.response?.data || error);
      setError(error.response?.data?.error || "Failed to delete category");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (category) => {
    setCurrentCategory(category);
    setmoduleName(category.name);
    setShowEditModal(true);
  };

  // Fonction pour ouvrir le modal de suppression
  const openDeleteModal = (category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
  };

  // Fonction pour gérer le logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Empêcher la propagation des événements lors des actions sur les catégories
  const handleCategoryActionClick = (e, category, action) => {
    e.stopPropagation();
    if (action === "edit") {
      openEditModal(category);
    } else if (action === "delete") {
      openDeleteModal(category);
    }
  };

  return (
    <div className="student-categories">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
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

      {/* Categories List */}
      <div className="categories-container">
        <h2 className="categories-title">My Categories</h2>

        {isLoading && !categories.length ? (
          <p>Loading categories...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <p className="no-categories">No categories yet.</p>
            <button
              className="create-first-category"
              onClick={() => setShowModal(true)}
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category) => (
              <div
                className="category-card"
                key={category.id}
                onClick={() => navigate(`/student/categories/${category.id}`)}
              >
                <div className="category-header">
                  <h3>{category.name}</h3>
                  <div className="category-actions">
                    <button
                      className="edit-btn"
                      onClick={(e) =>
                        handleCategoryActionClick(e, category, "edit")
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) =>
                        handleCategoryActionClick(e, category, "delete")
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p>
                  Created: {new Date(category.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Category</h3>
            {error && <p className="modal-error">{error}</p>}
            <input
              type="text"
              placeholder="Category Name"
              value={moduleName}
              onChange={(e) => setmoduleName(e.target.value)}
              disabled={isLoading}
            />
            <div className="modal-buttons">
              <button
                onClick={handleCreateCategory}
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

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Category</h3>
            {error && <p className="modal-error">{error}</p>}
            <input
              type="text"
              placeholder="Category Name"
              value={moduleName}
              onChange={(e) => setmoduleName(e.target.value)}
              disabled={isLoading}
            />
            <div className="modal-buttons">
              <button
                onClick={handleEditCategory}
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

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Category</h3>
            {error && <p className="modal-error">{error}</p>}
            <p>Are you sure you want to delete "{currentCategory?.name}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-buttons">
              <button
                className="delete-confirm-btn"
                onClick={handleDeleteCategory}
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

export default StudentCategories;
