import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SharedQuizAccess.css";

const SharedQuizAccess = () => {
  const { quizId, token } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/teacher/quiz/${quizId}/access/${token}/`
        );
        setQuiz(response.data);
      } catch (error) {
        setError(error.response?.data?.error || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, token]);

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const handleSubmit = async () => {
    if (!localStorage.getItem("token")) {
      alert("Please log in to submit your answers");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/student/quizzes/${quizId}/submit/`,
        answers,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Rediriger vers la page de résultats
      navigate(`/student/quiz-results/${quizId}`, {
        state: {
          results: response.data,
          quizTitle: quiz.titre,
        },
      });
    } catch (error) {
      setError(error.response?.data?.error || "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading quiz...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!quiz) return <div className="error">Quiz not found</div>;

  return (
    <div className="shared-quiz-container">
      <div className="quiz-header">
        <h1>{quiz.titre}</h1>
        <p className="quiz-description">{quiz.description}</p>
      </div>

      <div className="questions-container">
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="question-card">
            <h3>Question {index + 1}</h3>
            <p className="question-text">{question.enonce}</p>
            <div className="choices-container">
              {question.choix.map((choice) => (
                <label key={choice.id} className="choice-label">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={choice.id}
                    checked={answers[question.id] === choice.id}
                    onChange={() => handleAnswerChange(question.id, choice.id)}
                  />
                  <span className="choice-text">{choice.texte}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="quiz-actions">
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Quiz"}
        </button>
      </div>
    </div>
  );
};

export default SharedQuizAccess;
