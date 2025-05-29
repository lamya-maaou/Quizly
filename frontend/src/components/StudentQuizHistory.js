import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./StudentQuizHistory.css";

const StudentQuizHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/student/categories/${id}/quizzes/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setQuizzes(response.data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setError("Failed to load quizzes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (isLoading) return <div className="loading">Loading quizzes...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="quiz-history-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
        </div>
        <div className="navbar-right">
          <button
            className="back-button"
            onClick={() => navigate(`/student/categories/${id}`)}
          >
            Back to Module
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="quiz-history-content">
        <h2>Quiz History</h2>
        {quizzes.length === 0 ? (
          <div className="no-quizzes">
            <p>No quizzes have been generated yet.</p>
            <button
              className="generate-quiz-btn"
              onClick={() => navigate(`/student/categories/${id}`)}
            >
              Generate a Quiz
            </button>
          </div>
        ) : (
          <div className="quizzes-grid">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-card">
                <h3>{quiz.titre}</h3>
                <p className="quiz-date">
                  Generated on:{" "}
                  {new Date(quiz.date_creation).toLocaleDateString()}
                </p>
                <p className="quiz-description">{quiz.description}</p>
                <div className="quiz-stats">
                  <span>Questions: {quiz.questions?.length || 0}</span>
                </div>
                <button
                  className="view-quiz-btn"
                  onClick={() =>
                    navigate(`/student/categories/${id}/quizzes/${quiz.id}`)
                  }
                >
                  View Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizHistory;
