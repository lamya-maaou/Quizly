import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaQuestionCircle,
  FaSignOutAlt,
  FaChartBar,
  FaUsers,
  FaTrophy,
  FaUser,
  FaHistory,
} from "react-icons/fa";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:8000/api/";

const actionLabels = {
  LOGIN: "Login",
  CREATE_QUIZ: "Quiz created",
  MANAGE_USER: "User managed",
};

const iconForProgress = (type) => {
  if (type === "success") return <FaChartBar />;
  if (type === "participation") return <FaUsers />;
  return <FaTrophy />;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/admin/dashboard";
  const [stats, setStats] = useState({ teachers: 0, students: 0, quizzes: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");

  // Get token from localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Global stats
        const statsRes = await axios.get(API_BASE + "admin/dashboard/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(statsRes.data);

        // 2. Recent activities (logs)
        const actRes = await axios.get(API_BASE + "admin/logs/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecentActivities(actRes.data);
      } catch (err) {
        alert(
          "Error loading dashboard data: " +
            (err.response?.data?.detail || err.message)
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    switch (section) {
      case "users":
        navigate("/admin/users");
        break;
      case "quizzes":
        navigate("/admin/quizzes");
        break;
      case "history":
        navigate("/admin/history");
        break;
      default:
        navigate("/admin/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header
        className={`admin-header ${
          isDashboard ? "dashboard-header" : "other-header"
        }`}
      >
        <div className="admin-header-title">Quizly Administration</div>
        <div className="admin-header-actions">
          <button className="admin-logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">Quizly</div>
        <nav className="sidebar-list">
          <a
            href="#"
            className={`sidebar-list-item ${
              activeSection === "dashboard" ? "active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation("dashboard");
            }}
          >
            <FaChartBar className="sidebar-list-icon" /> Dashboard
          </a>
          <a
            href="#"
            className={`sidebar-list-item ${
              activeSection === "users" ? "active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation("users");
            }}
          >
            <FaChalkboardTeacher className="sidebar-list-icon" /> Users
          </a>
          <a
            href="#"
            className={`sidebar-list-item ${
              activeSection === "quizzes" ? "active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation("quizzes");
            }}
          >
            <FaQuestionCircle className="sidebar-list-icon" /> Quizzes
          </a>
          <a
            href="#"
            className={`sidebar-list-item ${
              activeSection === "history" ? "active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation("history");
            }}
          >
            <FaHistory className="sidebar-list-icon" /> History
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        {/* Main stats */}
        <section className="stats-row">
          <div className="stat-card">
            <div className="stat-card-icon">
              <FaChalkboardTeacher />
            </div>
            <div>
              <div className="stat-card-title">Teachers</div>
              <div className="stat-card-value">{stats.teachers}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">
              <FaUserGraduate />
            </div>
            <div>
              <div className="stat-card-title">Students</div>
              <div className="stat-card-value">{stats.students}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">
              <FaQuestionCircle />
            </div>
            <div>
              <div className="stat-card-title">Quizzes</div>
              <div className="stat-card-value">{stats.quizzes}</div>
            </div>
          </div>
        </section>

        {/* Only activities (logs) since no quiz history/progress endpoints */}
        <section className="bottom-row">
          <div className="activity-card" style={{ flex: 1 }}>
            <div className="table-title">Recent Activities</div>
            {recentActivities.length === 0 ? (
              <div>No recent activities found.</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Admin</th>
                    <th>Date/Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.slice(0, 10).map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        {activity.action
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </td>
                      <td>
                        {activity.admin && activity.admin.user
                          ? activity.admin.user.email
                          : activity.admin_username || "-"}
                      </td>
                      <td>{new Date(activity.created_at).toLocaleString()}</td>
                      <td>
                        {activity.details
                          ? typeof activity.details === "object"
                            ? Object.entries(activity.details)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(", ")
                            : String(activity.details)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
