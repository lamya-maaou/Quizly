import React from "react";
import BackToDashboardButton from "./BackToDashboardButton";
import "./AdminPage.css";

const AdminStats = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <BackToDashboardButton />
        <h1 className="admin-users-title">Statistics</h1>
      </div>
      <div className="admin-page-content">
        <p>Statistics and charts will be displayed here.</p>
      </div>
    </div>
  );
};

export default AdminStats;
