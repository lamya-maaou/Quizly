import React, { useEffect, useState } from "react";
import BackToDashboardButton from "./BackToDashboardButton";
import axios from "axios";
import "./AdminPage.css";

const API_BASE = "http://localhost:8000/api/";

const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(API_BASE + "admin/quiz-history/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data);
      } catch (err) {
        setHistory([]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <BackToDashboardButton />
        <h1 className="admin-users-title">Quiz History</h1>
      </div>
      <div className="admin-page-content">
        {loading ? (
          <div>Loading quiz history...</div>
        ) : history.length === 0 ? (
          <div>No quiz results found.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Quiz Title</th>
                <th>Score</th>
                <th>Date Taken</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{item.student}</td>
                  <td>{item.quiz_title}</td>
                  <td>{item.score}</td>
                  <td>{item.date_taken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminHistory;
