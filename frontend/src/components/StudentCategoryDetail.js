import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./StudentCategoryDetail.css";

const StudentCategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showQuizAccessModal, setShowQuizAccessModal] = useState(false);
  const [quizLink, setQuizLink] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Constantes pour les limites
  const MAX_FILE_SIZE = 1048576; // 1 Mo en octets
  const MAX_FILE_SIZE_MO = (MAX_FILE_SIZE / 1048576).toFixed(2);

  const fetchModuleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/student/categories/${id}/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setModule(response.data);

      // If there's a PDF associated with the module, set it
      if (response.data.pdfs && response.data.pdfs.length > 0) {
        setPdfFile({
          id: response.data.pdfs[0].id,
          name: response.data.pdfs[0].titre,
          url: `http://localhost:8000${response.data.pdfs[0].fichier}`,
          size: response.data.pdfs[0].size,
          isNew: false,
        });
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
      setError("Failed to load category data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateFile = (file) => {
    // Vérification du type de fichier
    if (file.type !== "application/pdf") {
      setErrorMessage("Please upload only PDF files");
      setShowErrorModal(true);
      return false;
    }

    // Vérification de la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File size exceeds the limit of ${MAX_FILE_SIZE_MO} Mo (${(
          file.size / 1048576
        ).toFixed(2)} MB)`
      );
      setShowErrorModal(true);
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    setPdfFile({
      file,
      id: `local-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      isNew: true,
    });
    setError(null);
    setGeneratedQuiz(null);
  };

  const deletePdf = async () => {
    if (!pdfFile) return;

    setIsLoading(true);
    try {
      if (!pdfFile.isNew) {
        await axios.delete(
          `http://localhost:8000/api/student/categories/${id}/pdfs/${pdfFile.id}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      // Libérer l'URL de l'objet blob si c'est un nouveau fichier
      if (pdfFile.url && pdfFile.isNew) {
        URL.revokeObjectURL(pdfFile.url);
      }

      setPdfFile(null);
      setGeneratedQuiz(null);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to delete PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async () => {
    if (!pdfFile || !pdfFile.isNew) return;

    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", pdfFile.file);

      const response = await axios.post(
        `http://localhost:8000/api/student/categories/${id}/upload/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update with the saved PDF
      const pdfUrl = `http://localhost:8000${response.data.fichier}`;
      setPdfFile({
        id: response.data.id,
        name: response.data.titre,
        url: pdfUrl,
        size: pdfFile.size,
        isNew: false,
      });
    } catch (error) {
      setError(error.response?.data?.error || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!pdfFile) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/student/categories/${id}/generate_quiz/`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Rediriger vers la page du quiz
      navigate(`/student/categories/${id}/quizzes/${response.data.id}`);
    } catch (error) {
      console.error("Quiz generation failed:", error);
      setError(error.response?.data?.error || "Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, choiceIndex) => {
    if (quizSubmitted) return;

    const newAnswers = [...userAnswers];
    newAnswers[questionIndex].answer = choiceIndex;
    setUserAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (!generatedQuiz) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/student/quizzes/${generatedQuiz.id}/submit/`,
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
      setQuizSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setError(
        error.response?.data?.error || error.message || "Failed to submit quiz"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleQuizAccess = () => {
    setShowQuizAccessModal(true);
  };

  const handleJoinQuiz = async () => {
    if (!quizLink) return;

    setIsLoading(true);
    setError(null);
    try {
      // Nettoyer et valider le lien
      const cleanLink = quizLink.trim();
      console.log("Lien nettoyé:", cleanLink);

      // Extraire l'ID du quiz
      let quizId;

      // Si le lien contient des slashes, c'est une URL
      if (cleanLink.includes("/")) {
        // Extraire le dernier segment de l'URL
        const segments = cleanLink.split("/").filter((segment) => segment);
        quizId = segments[segments.length - 1];
        console.log("ID extrait de l'URL:", quizId);
      } else {
        // Si c'est juste un ID
        quizId = cleanLink;
        console.log("ID direct:", quizId);
      }

      // Vérifier que l'ID est un nombre valide
      const numericId = parseInt(quizId, 10);
      console.log("ID numérique:", numericId);

      if (isNaN(numericId)) {
        throw new Error(
          "Format de lien invalide : l'ID du quiz doit être un nombre"
        );
      }

      // Vérifier si le quiz existe et est accessible
      console.log("Tentative d'accès au quiz:", numericId);
      try {
        // Vérifier d'abord si le quiz existe dans la liste des quizzes disponibles
        const availableQuizzesResponse = await axios.get(
          `http://localhost:8000/api/student/available-quizzes/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Quizzes disponibles:", availableQuizzesResponse.data);

        // Vérifier si le quiz existe dans la liste des quizzes disponibles
        const quizExists = availableQuizzesResponse.data.some(
          (quiz) => quiz.id === numericId
        );

        if (!quizExists) {
          console.log("Quiz non trouvé dans la liste des quizzes disponibles");
          throw new Error("Ce quiz n'est pas disponible pour le moment");
        }

        // Vérifier les détails du quiz
        const quizResponse = await axios.get(
          `http://localhost:8000/api/student/quizzes/${numericId}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Quiz data:", quizResponse.data);

        if (!quizResponse.data) {
          throw new Error("Quiz non trouvé : aucune donnée reçue du serveur");
        }

        // Vérifier si le quiz appartient au module actuel
        if (
          quizResponse.data.module_id &&
          quizResponse.data.module_id !== parseInt(id, 10)
        ) {
          throw new Error("Ce quiz n'appartient pas au module actuel");
        }

        // Vérifier si le quiz est actif
        if (quizResponse.data.status === "inactive") {
          throw new Error("Ce quiz n'est pas actif pour le moment");
        }

        // Vérifier si l'étudiant a déjà passé ce quiz
        if (quizResponse.data.is_completed) {
          throw new Error("Vous avez déjà passé ce quiz");
        }

        // Rediriger vers le quiz
        navigate(`/student/categories/${id}/quizzes/${numericId}`);
      } catch (apiError) {
        console.error("Erreur API détaillée:", {
          status: apiError.response?.status,
          data: apiError.response?.data,
          message: apiError.message,
        });

        if (apiError.response?.status === 404) {
          throw new Error("Quiz non trouvé : l'ID du quiz n'existe pas");
        } else if (apiError.response?.status === 403) {
          throw new Error("Vous n'avez pas accès à ce quiz");
        } else if (apiError.response?.status === 401) {
          throw new Error("Votre session a expiré. Veuillez vous reconnecter");
        } else if (apiError.response?.data?.error) {
          throw new Error(apiError.response.data.error);
        } else if (apiError.message) {
          throw new Error(apiError.message);
        } else {
          throw new Error(
            "Une erreur inattendue s'est produite lors de l'accès au quiz"
          );
        }
      }
    } catch (error) {
      console.error("Erreur détaillée:", error);
      let errorMessage =
        error.message || "Lien du quiz invalide ou quiz non accessible";

      setError(errorMessage);
      setShowErrorModal(true);
      setErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleData();
    return () => {
      if (pdfFile && pdfFile.url && pdfFile.isNew) {
        URL.revokeObjectURL(pdfFile.url);
      }
    };
  }, [fetchModuleData, pdfFile]);

  if (isLoading && !module)
    return <div className="loading">Loading module details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!module) return <div className="error">Module not found</div>;

  return (
    <div className="module-detail-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
        </div>
        <div className="navbar-right">
          <button className="join-quiz-btn" onClick={handleQuizAccess}>
            Passer Quiz
          </button>
          <button
            className="history-btn"
            onClick={() => navigate(`/student/categories/${id}/quizzes`)}
          >
            View Quiz History
          </button>
          <button
            className="back-button"
            onClick={() => navigate("/student/categories")}
          >
            Back to Categories
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="module-content">
        <h1 className="module-title">{module.name}</h1>

        <div className="pdf-section">
          <div className="pdf-upload-section">
            <h2>Upload your PDF file</h2>
            <div className="upload-info">
              <p>
                <strong>File Requirements :</strong>
              </p>
              <ul>
                <li>Format: PDF only</li>
                <li>Maximum size: {MAX_FILE_SIZE_MO} Mo</li>
                <li>Approximately 3000 words or 8 pages of text</li>
              </ul>
            </div>

            {showErrorModal && (
              <div className="error-modal-overlay">
                <div className="error-modal">
                  <div className="modal-header">
                    <h3>Error</h3>
                    <button
                      className="close-modal"
                      onClick={() => setShowErrorModal(false)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="modal-body">
                    <p>{errorMessage}</p>
                  </div>
                  <div className="modal-actions">
                    <button
                      className="back-button"
                      onClick={() => setShowErrorModal(false)}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!pdfFile && (
              <div
                className={`drop-zone ${isDragOver ? "drag-over" : ""} ${
                  error ? "error-zone" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input").click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <div className="drop-zone-content">
                  <p>Drag & drop your PDF file here or click to select</p>
                  <p className="hint">(Only one PDF file at a time)</p>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {pdfFile && (
              <div className="pdf-actions">
                <div className="file-info">
                  <span className="file-name">{pdfFile.name}</span>
                  <span className="file-size">
                    ({(pdfFile.size / 1048576).toFixed(2)} MB)
                  </span>
                </div>
                {pdfFile.isNew ? (
                  <button
                    className="upload-btn"
                    onClick={uploadFile}
                    disabled={isLoading}
                  >
                    {isLoading ? "Uploading..." : "Upload PDF"}
                  </button>
                ) : (
                  <button
                    className="generate-quiz-btn"
                    onClick={generateQuiz}
                    disabled={isLoading}
                  >
                    {isLoading ? "Generating..." : "Generate Quiz"}
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={deletePdf}
                  disabled={isLoading}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="pdf-preview-section">
            {pdfFile ? (
              <div className="pdf-preview-container">
                <div className="pdf-viewer">
                  <iframe
                    src={pdfFile.url}
                    title="PDF Preview"
                    width="100%"
                    height="500px"
                    frameBorder="0"
                  ></iframe>
                </div>
              </div>
            ) : (
              <div className="no-pdf">
                <p>No file selected</p>
                <p>Upload a PDF file to preview it here</p>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Modal */}
        {showQuizModal && generatedQuiz && (
          <div className="quiz-modal-overlay">
            <div className="quiz-modal">
              <div className="modal-header">
                <h2>{generatedQuiz.title}</h2>
                <p>{generatedQuiz.description}</p>
                <button
                  className="close-modal"
                  onClick={() => setShowQuizModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div className="questions-container">
                  {generatedQuiz.questions.map((question, qIndex) => (
                    <div key={qIndex} className="question-card">
                      <h3>Question {qIndex + 1}</h3>
                      <p>{question.text}</p>

                      <div className="choices-container">
                        {question.choices.map((choice, cIndex) => (
                          <div key={cIndex} className="choice-item">
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              id={`question-${qIndex}-choice-${cIndex}`}
                              checked={userAnswers[qIndex]?.answer === cIndex}
                              onChange={() =>
                                handleAnswerSelect(qIndex, cIndex)
                              }
                              disabled={quizSubmitted}
                            />
                            <label
                              htmlFor={`question-${qIndex}-choice-${cIndex}`}
                              className={
                                quizSubmitted
                                  ? choice.is_correct
                                    ? "correct-answer"
                                    : userAnswers[qIndex]?.answer === cIndex
                                    ? "incorrect-answer"
                                    : ""
                                  : ""
                              }
                            >
                              {choice.text}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                {!quizSubmitted ? (
                  <button
                    className="submit-quiz"
                    onClick={submitQuiz}
                    disabled={
                      isLoading || userAnswers.some((a) => a.answer === null)
                    }
                  >
                    {isLoading ? "Submitting..." : "Submit Quiz"}
                  </button>
                ) : (
                  <div className="quiz-result">
                    <h3>
                      Your Score: {score}/{generatedQuiz.questions.length}
                    </h3>
                    <button
                      className="close-quiz"
                      onClick={() => setShowQuizModal(false)}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal pour accéder au quiz */}
        {showQuizAccessModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Accéder au Quiz</h2>
                <button
                  className="close-modal"
                  onClick={() => setShowQuizAccessModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="quiz-access-options">
                  <button
                    className="scan-qr-btn"
                    onClick={() => setShowQRScanner(true)}
                  >
                    Scanner le QR Code
                  </button>
                  <div className="or-divider">
                    <span>ou</span>
                  </div>
                  <div className="link-input">
                    <p className="input-label">
                      Entrez l'ID du quiz ou l'URL complète
                    </p>
                    <p className="input-hint">
                      Exemple: 123 ou
                      http://localhost:3000/student/categories/1/quizzes/123
                    </p>
                    <input
                      type="text"
                      value={quizLink}
                      onChange={(e) => setQuizLink(e.target.value)}
                      placeholder="Entrez l'ID du quiz (ex: 123)"
                      className={error ? "input-error" : ""}
                    />
                    {error && <p className="error-text">{error}</p>}
                  </div>
                </div>
                {showQRScanner && (
                  <div className="qr-scanner">
                    <p>Fonctionnalité de scan QR à venir</p>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button
                  className="join-quiz-btn"
                  onClick={handleJoinQuiz}
                  disabled={!quizLink}
                >
                  Rejoindre le Quiz
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setShowQuizAccessModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCategoryDetail;
