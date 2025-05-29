import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentQuizDetail.css";

const StudentQuizDetail = () => {
  const { id, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/student/quizzes/${quizId}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Quiz data received:", response.data);

        // Vérifier que la réponse contient les données nécessaires
        if (!response.data || !response.data.questions) {
          console.error("Invalid quiz data structure:", response.data);
          throw new Error("Invalid quiz data received from server");
        }

        // Vérifier que chaque question a des choix
        const validQuestions = response.data.questions.filter((question) => {
          console.log("Question data:", question);
          const isValid =
            question &&
            Array.isArray(question.choix) &&
            question.choix.length > 0;
          if (!isValid) {
            console.log("Invalid question:", question);
          }
          return isValid;
        });

        console.log("Valid questions:", validQuestions);

        if (validQuestions.length === 0) {
          console.error(
            "No valid questions found. Original questions:",
            response.data.questions
          );
          throw new Error("No valid questions found in the quiz");
        }

        setQuiz({
          ...response.data,
          questions: validQuestions,
        });

        // Initialiser les réponses
        setUserAnswers(
          validQuestions.map((question) => ({
            questionId: question.id,
            answer: null,
          }))
        );
      } catch (error) {
        console.error("Error fetching quiz:", error);
        setError(
          error.response?.data?.error || error.message || "Failed to load quiz"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleAnswerSelect = (questionIndex, choiceIndex) => {
    if (isSubmitted) return;

    const newAnswers = [...userAnswers];
    newAnswers[questionIndex].answer = choiceIndex;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/student/quizzes/${quizId}/submit/`,
        {
          answers: userAnswers.map((answer) => ({
            question_id: answer.questionId,
            selected_choice_index: answer.answer,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      setScore(response.data.score);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setError(error.response?.data?.error || "Failed to submit quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/student/categories/${id}/quizzes`);
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
          <button
            className="dashboard-button"
            onClick={() => navigate("/student/dashboard")}
          >
            Dashboard
          </button>
          <button className="back-button" onClick={handleBack}>
            Back to Quizzes
          </button>
        </div>
      </nav>

      <div className="quiz-content">
        <h1>{quiz.titre}</h1>
        <p className="quiz-description">{quiz.description}</p>

        <div className="questions-container">
          {quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <h3>Question {qIndex + 1}</h3>
              <p>{question.enonce}</p>
              {Array.isArray(question.choix) && question.choix.length > 0 ? (
                <div className="choices">
                  {question.choix.map((choice, cIndex) => (
                    <div
                      key={cIndex}
                      className={`choice ${
                        userAnswers[qIndex]?.answer === cIndex ? "selected" : ""
                      } ${
                        isSubmitted
                          ? choice.is_correct
                            ? "correct"
                            : userAnswers[qIndex]?.answer === cIndex
                            ? "incorrect"
                            : ""
                          : ""
                      }`}
                      onClick={() => handleAnswerSelect(qIndex, cIndex)}
                    >
                      {choice.texte}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="error">No choices available for this question</p>
              )}
            </div>
          ))}
        </div>

        {!isSubmitted ? (
          <button
            className="submit-quiz"
            onClick={handleSubmit}
            disabled={isLoading || userAnswers.some((a) => a.answer === null)}
          >
            {isLoading ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <div className="quiz-result">
            <h2>Quiz Completed!</h2>
            <p>
              Your Score: {score}/{quiz.questions.length}
            </p>
            <button className="back-button" onClick={handleBack}>
              Back to Quizzes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizDetail;
