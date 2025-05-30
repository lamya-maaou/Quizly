import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./BackToDashboardButton.css";

const BackToDashboardButton = () => {
  const navigate = useNavigate();
  return (
    <button
      className="back-dashboard-btn"
      onClick={() => navigate("/admin/dashboard")}
      title="Back to Dashboard"
    >
      <FaArrowLeft style={{ fontSize: 20 }} />
    </button>
  );
};

export default BackToDashboardButton;
