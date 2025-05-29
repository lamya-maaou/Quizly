import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TeacherQuizHistory.css";

const TeacherQuizHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]); // Initialisez avec un tableau vide
  const [isLoading, setIsLoading] = useState(true); // Commencez avec true
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/teacher/modules/${id}/quizzes/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setQuizzes(response.data || []); // Garantissez un tableau même si response.data est undefined
      } catch (error) {
        setError(error.response?.data?.error || "Failed to load quizzes");
        setQuizzes([]); // En cas d'erreur, définissez un tableau vide
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [id]);

  const handleBack = () => {
    navigate(`/teacher/modules/${id}`);
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
          <button className="back-button" onClick={handleBack}>
            Back to Module
          </button>
        </div>
      </nav>

      <div className="quiz-history-content">
        <h1>Quiz History</h1>

        {quizzes.length === 0 ? (
          <div className="no-quizzes">No quizzes found for this module</div>
        ) : (
          <div className="quizzes-list">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-card">
                <h3>{quiz.titre}</h3>
                <p>{quiz.description}</p>
                <div className="quiz-meta">
                  <span>
                    Created: {new Date(quiz.date_creation).toLocaleDateString()}
                  </span>
                  <span>{quiz.questions_count || 0} questions</span>
                </div>
                <button
                  className="view-details"
                  onClick={() =>
                    navigate(`/teacher/modules/${id}/quizzes/${quiz.id}`)
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

export default TeacherQuizHistory;
