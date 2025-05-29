import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchQuizResults = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:8000/api/student/quiz-results/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const results = Array.isArray(response.data) ? response.data : [];
      setQuizResults(results);
    } catch (err) {
      console.error("Error details:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch quiz results. Please try again later."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizResults();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchQuizResults();
  };

  if (isLoading) {
    return (
      <div className="loading">
        <p>Loading your quiz results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button className="action-button" onClick={handleRetry}>
          Try Again
        </button>
      </div>
    );
  }

  const results = Array.isArray(quizResults) ? quizResults : [];

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
        </div>
        <div className="navbar-right">
          <button
            className="nav-button"
            onClick={() => navigate("/student/categories")}
          >
            Back to Categories
          </button>
          <button className="nav-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1>My Quiz Results</h1>

        {results.length === 0 ? (
          <div className="no-results">
            <p>You haven't taken any quizzes yet.</p>
            <button
              className="action-button"
              onClick={() => navigate("/student/categories")}
            >
              Browse Categories
            </button>
          </div>
        ) : (
          <div className="results-grid">
            {results.map((result) => (
              <div key={result.id} className="result-card">
                <h3>{result.quiz_title}</h3>
                <div className="result-details">
                  <p>Score: {result.score}%</p>
                  <p>
                    Date: {new Date(result.completed_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="action-button"
                  onClick={() =>
                    navigate(
                      `/student/categories/${result.category_id}/quizzes/${result.quiz_id}`
                    )
                  }
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
