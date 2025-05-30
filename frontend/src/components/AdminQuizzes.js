import React, { useEffect, useState } from "react";
import BackToDashboardButton from "./BackToDashboardButton";
import axios from "axios";
import "./AdminPage.css";

const API_BASE = "http://localhost:8000/api/";

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(API_BASE + "admin/quizzes/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizzes(res.data);
      } catch (err) {
        setQuizzes([]);
      }
      setLoading(false);
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <BackToDashboardButton />
        <h1 className="admin-users-title">Quiz Management</h1>
      </div>
      <div className="admin-page-content">
        {loading ? (
          <div>Loading quizzes...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td>{quiz.titre}</td>
                  <td>{quiz.description}</td>
                  <td>{quiz.date_creation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminQuizzes;
