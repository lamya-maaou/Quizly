import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Clock,
  BookOpen,
  LogOut,
  BarChart3,
  ArrowLeftCircle,
} from "lucide-react";
import "./StudentDashboard.css";
import "../styles/common.css";

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
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuizResults(response.data.results || []);
    } catch (err) {
      console.error("Error fetching quiz results:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load quiz results."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizResults();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getPerformanceLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 50) return "Average";
    return "Weak";
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return "green";
    if (score >= 75) return "blue";
    if (score >= 50) return "orange";
    return "red";
  };

  if (isLoading) return <div className="loading">Loading...</div>;

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchQuizResults}>Retry</button>
      </div>
    );
  }

  const stats = {
    totalQuizzes: quizResults.length,
    avgScore:
      quizResults.length > 0
        ? Math.round(
            quizResults.reduce((sum, q) => sum + q.percentage, 0) /
              quizResults.length
          )
        : 0,
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <span className="logo">Quizly</span>
        <div className="nav-actions">
          <button onClick={() => navigate("/student/categories")}>
             Back to categories
          </button>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1>Student Dashboard</h1>

        <div className="stats-section">
          <div className="stat-card">
            <BarChart3 size={32} />
            <p>Total Quizzes</p>
            <h3>{stats.totalQuizzes}</h3>
          </div>
          <div className="stat-card">
            <Trophy size={32} />
            <p>Average Score</p>
            <h3>{stats.avgScore}%</h3>
          </div>
        </div>

        {quizResults.length === 0 ? (
          <div className="no-results">
            <p>No quizzes taken yet.</p>
            <button onClick={() => navigate("/student/categories")}>
              Explore Quizzes
            </button>
          </div>
        ) : (
          <div className="results-grid">
            {quizResults.map((result) => (
              <div key={result.id} className="result-card">
                <h3>{result.quiz_title}</h3>
                <p>
                  <BookOpen size={16} /> Module: {result.module_name}
                </p>
                <p>
                  <Clock size={16} /> Date:{" "}
                  {new Date(result.date_taken).toLocaleDateString()}
                </p>
                <p style={{ color: getPerformanceColor(result.percentage) }}>
                  🎯 Score: {result.percentage}% –{" "}
                  {getPerformanceLabel(result.percentage)}
                </p>
                <button
                  className="details-button"
                  onClick={() =>
                    navigate(
                      `/student/categories/${result.module_id}/quizzes/${result.quiz_id}`
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