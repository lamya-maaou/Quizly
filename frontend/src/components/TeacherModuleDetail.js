import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./TeacherModuleDetail.css";

const TeacherModuleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Constantes pour les limites
  const MAX_FILE_SIZE = 1048576; // 1 Mo en octets
  const MAX_FILE_SIZE_MO = (MAX_FILE_SIZE / 1048576).toFixed(2);

  const fetchModuleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/teacher/modules/${id}/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setModule(response.data);
      setPdfFile(null);
    } catch (error) {
      console.error("Error fetching module data:", error);
      setError("Failed to load module data");
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
        `File size exceeds the limit of ${MAX_FILE_SIZE_MO} MB (${(
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
    setIsUploaded(false);
    setError(null);
    setGeneratedQuiz(null);
  };

  const deletePdf = async () => {
    if (!pdfFile) return;

    setIsLoading(true);
    try {
      if (!pdfFile.isNew) {
        await axios.delete(
          `http://localhost:8000/api/teacher/modules/${id}/pdfs/${pdfFile.id}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      if (pdfFile.url && pdfFile.isNew) {
        URL.revokeObjectURL(pdfFile.url);
      }

      setPdfFile(null);
      setIsUploaded(false);
      setGeneratedQuiz(null);
      setUploadSuccess("PDF deleted successfully");
      setTimeout(() => setUploadSuccess(null), 3000);
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
        `http://localhost:8000/api/teacher/modules/${id}/upload/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const pdfUrl = `http://localhost:8000${response.data.fichier}`;
      setPdfFile({
        id: response.data.id,
        name: response.data.titre,
        url: pdfUrl,
        size: pdfFile.size,
        isNew: false,
      });

      setIsUploaded(true);
      setUploadSuccess("PDF uploaded successfully!");
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.error || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!isUploaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/teacher/modules/${id}/generate_quiz/`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data || !response.data.questions) {
        throw new Error("Invalid quiz data received from server");
      }

      // Transformer les questions pour correspondre au format attendu
      const transformedQuestions = response.data.questions.map((question) => ({
        text: question.enonce || "",
        choices: (question.choix || []).map((choice) => ({
          text: choice.texte || "",
          is_correct: choice.is_correct || false,
        })),
      }));

      setGeneratedQuiz(response.data);
      setEditedQuestions(transformedQuestions);
      setShowQuizModal(true);
    } catch (error) {
      console.error("Quiz generation failed:", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to generate quiz"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    if (!editedQuestions || !Array.isArray(editedQuestions)) return;

    const updatedQuestions = [...editedQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setEditedQuestions(updatedQuestions);
  };

  const handleChoiceChange = (qIndex, cIndex, value) => {
    if (!editedQuestions || !Array.isArray(editedQuestions)) return;

    const updatedQuestions = [...editedQuestions];
    if (!updatedQuestions[qIndex] || !updatedQuestions[qIndex].choices) return;

    updatedQuestions[qIndex].choices[cIndex] = {
      ...updatedQuestions[qIndex].choices[cIndex],
      text: value,
    };
    setEditedQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, cIndex) => {
    if (!editedQuestions || !Array.isArray(editedQuestions)) return;

    const updatedQuestions = [...editedQuestions];
    if (!updatedQuestions[qIndex] || !updatedQuestions[qIndex].choices) return;

    updatedQuestions[qIndex].choices = updatedQuestions[qIndex].choices.map(
      (choice, index) => ({
        ...choice,
        is_correct: index === cIndex,
      })
    );
    setEditedQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    const newQuestion = {
      text: "",
      choices: [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    };

    setEditedQuestions((prevQuestions) => [
      ...(prevQuestions || []),
      newQuestion,
    ]);
  };

  const removeQuestion = async (index) => {
    const questionToRemove = editedQuestions[index];

    try {
      setIsLoading(true);

      if (questionToRemove.id) {
        await axios.delete(
          `http://localhost:8000/api/teacher/questions/${questionToRemove.id}/delete/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      const updatedQuestions = [...editedQuestions];
      updatedQuestions.splice(index, 1);
      setEditedQuestions(updatedQuestions);
    } catch (error) {
      console.error("Error deleting question:", error);
      setError(error.response?.data?.error || "Failed to delete question");
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!generatedQuiz) return;

    setIsLoading(true);
    setError(null);

    try {
      const quizData = {
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        questions: editedQuestions.map((q, qIndex) => ({
          id: q.id || null,
          text: q.text,
          choices: q.choices.map((c, cIndex) => ({
            id: c.id || null,
            text: c.text,
            is_correct: q.choices.some((choice) => choice.is_correct)
              ? c.is_correct
              : cIndex === 0,
          })),
        })),
      };

      await axios.put(
        `http://localhost:8000/api/teacher/quizzes/${generatedQuiz.id}/update/`,
        quizData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedQuiz = await axios.get(
        `http://localhost:8000/api/teacher/quizzes/${generatedQuiz.id}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setGeneratedQuiz(updatedQuiz.data);
      setEditedQuestions(updatedQuiz.data.questions);
      setShowQuizModal(false);
      setUploadSuccess("Quiz saved successfully!");
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving quiz:", error);
      setError(
        error.response?.data?.error || error.message || "Failed to save quiz"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    fetchModuleData();
    return () => {
      if (pdfFile && pdfFile.url) {
        URL.revokeObjectURL(pdfFile.url);
      }
    };
  }, [fetchModuleData, pdfFile]);

  if (isLoading && !module)
    return <div className="loading">Loading subject details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!module) return <div className="error">Subject not found</div>;

  return (
    <div className="module-detail-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">QUIZLY</span>
        </div>
        <div className="navbar-right">
          <button
            className="history-btn"
            onClick={() => navigate(`/teacher/modules/${id}/quizzes`)}
          >
            View Quiz History
          </button>
          <button
            className="back-button"
            onClick={() => navigate("/teacher/modules")}
          >
            Back to Subjects
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
            </div>

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

            {uploadSuccess && (
              <div className="success-message">{uploadSuccess}</div>
            )}
            {/* {error && <div className="error-message">{error}</div>} */}

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
                    disabled={isLoading || !isUploaded}
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

        {showQuizModal && generatedQuiz && (
          <div className="quiz-modal-overlay">
            <div className="quiz-modal">
              <div className="modal-header">
                <h2>Edit Generated Quiz</h2>
                <button
                  className="close-modal"
                  onClick={() => setShowQuizModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div className="quiz-info">
                  <input
                    type="text"
                    value={generatedQuiz.title}
                    onChange={(e) =>
                      setGeneratedQuiz({
                        ...generatedQuiz,
                        title: e.target.value,
                      })
                    }
                    placeholder="Quiz Title"
                    className="quiz-title-input"
                  />
                  <textarea
                    value={generatedQuiz.description}
                    onChange={(e) =>
                      setGeneratedQuiz({
                        ...generatedQuiz,
                        description: e.target.value,
                      })
                    }
                    placeholder="Quiz Description"
                    className="quiz-description-input"
                  />
                </div>

                <div className="questions-container">
                  {editedQuestions.map((question, qIndex) => (
                    <div key={qIndex} className="question-card">
                      <div className="question-header">
                        <h3>Question {qIndex + 1}</h3>
                        <button
                          className="remove-question"
                          onClick={() => removeQuestion(qIndex)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Deleting..." : "Remove"}
                        </button>
                      </div>

                      <textarea
                        value={question.text}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, "text", e.target.value)
                        }
                        placeholder="Enter question text..."
                        className="question-text-input"
                      />

                      <div className="choices-container">
                        <h4>Options:</h4>
                        {question.choices.map((choice, cIndex) => (
                          <div key={cIndex} className="choice-item">
                            <input
                              type="radio"
                              name={`correct-answer-${qIndex}`}
                              checked={choice.is_correct}
                              onChange={() =>
                                handleCorrectAnswerChange(qIndex, cIndex)
                              }
                              className="correct-answer-radio"
                            />
                            <input
                              type="text"
                              value={choice.text}
                              onChange={(e) =>
                                handleChoiceChange(
                                  qIndex,
                                  cIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`Option ${cIndex + 1}`}
                              className="choice-text-input"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button className="add-question" onClick={addQuestion}>
                    + Add Question
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="save-quiz"
                  onClick={saveQuiz}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Quiz"}
                </button>
                <button
                  className="cancel-quiz"
                  onClick={() => setShowQuizModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherModuleDetail;
