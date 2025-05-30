import React from "react";
import BackToDashboardButton from "./BackToDashboardButton";
import "./AdminPage.css";

const AdminBackup = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <BackToDashboardButton />
        <h1 className="admin-users-title">Backup & Restore</h1>
      </div>
      <div className="admin-page-content">
        <p>Backup history will be shown here.</p>
      </div>
    </div>
  );
};

export default AdminBackup;
