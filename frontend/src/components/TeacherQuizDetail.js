import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TeacherQuizDetail.css";

const TeacherQuizDetail = () => {
  const { id, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [restrictions, setRestrictions] = useState({
    expiry_date: "",
    max_participants: "",
  });

  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:8000/api/teacher/quizzes/${quizId}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setQuiz(response.data);
      } catch (error) {
        setError(error.response?.data?.error || "Failed to load quiz");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleBack = () => {
    navigate(`/teacher/modules/${id}/quizzes`);
  };

  const handleShareQuiz = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/teacher/quizzes/${quizId}/share/`, // Ajoutez le préfixe
        { restrictions },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      setShareData(response.data);
    } catch (error) {
      console.error("Sharing failed:", error);
      setError(error.response?.data?.error || "Failed to share quiz");
    }
  };

  if (isLoading) return <div className="loading">Loading quiz...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!quiz) return <div className="error">Quiz not found</div>;

  return (
    <div className="quiz-detail-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
        </div>
        <div className="navbar-right">
          <button className="back-button" onClick={handleBack}>
            Back to Quiz History
          </button>
        </div>
      </nav>

      <div className="quiz-detail-content">
        <h1>{quiz.titre}</h1>
        <p className="quiz-description">{quiz.description}</p>
        <div className="quiz-meta">
          <span>
            Created: {new Date(quiz.date_creation).toLocaleDateString()}
          </span>
        </div>

        <div className="questions-section">
          <h2>Questions</h2>
          {quiz.questions.map((question, qIndex) => (
            <div key={question.id} className="question-card">
              <h3>
                Question {qIndex + 1}: {question.enonce}
              </h3>
              <ul className="choices-list">
                {question.choix.map((choice, cIndex) => (
                  <li
                    key={choice.id}
                    className={choice.is_correct ? "correct-choice" : ""}
                  >
                    {choice.texte}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="quiz-actions">
          <button
            className="share-button"
            onClick={() => setShowShareModal(true)}
          >
            Share the quiz
          </button>
        </div>

        {showShareModal && (
          <div className="share-modal">
            <div className="modal-content">
              <h2>Share</h2>

              <div className="restrictions-form">
                <label>
                  Expiration date:
                  <input
                    type="datetime-local"
                    value={restrictions.expiry_date}
                    onChange={(e) =>
                      setRestrictions({
                        ...restrictions,
                        expiry_date: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Number of max participants:
                  <input
                    type="number"
                    value={restrictions.max_participants}
                    onChange={(e) =>
                      setRestrictions({
                        ...restrictions,
                        max_participants: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {shareData && (
                <div className="share-results">
                  <div className="qr-code-container">
                    {shareData.qr_code_url && (
                      <img
                        src={shareData.qr_code_url}
                        alt="QR Code"
                        onError={(e) => {
                          console.error("Failed to load QR code image:", e);
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="share-link">
                    <p>The link to share</p>
                    <input type="text" value={shareData.share_url} readOnly />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareData.share_url);
                        alert("Link copied!");
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button className="share-confirm" onClick={handleShareQuiz}>
                  Generate the link
                </button>
                <button
                  className="close-modal"
                  onClick={() => setShowShareModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherQuizDetail;
