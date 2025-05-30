import React from "react";
import BackToDashboardButton from "./BackToDashboardButton";
import "./AdminPage.css";

const AdminLogs = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <BackToDashboardButton />
        <h1 className="admin-users-title">Admin Logs</h1>
      </div>
      <div className="admin-page-content">
        <p>Admin activity logs will be shown here.</p>
      </div>
    </div>
  );
};

export default AdminLogs;
