import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState({ type: "", text: "" });
  const [resetLoading, setResetLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Try admin login first
      try {
        const adminResponse = await axios.post(
          "http://localhost:8000/api/admin/login/",
          {
            email: formData.email,
            password: formData.password,
          }
        );
        if (adminResponse.data.error === false) {
          const { data } = adminResponse.data;
          localStorage.setItem("token", data.access);
          localStorage.setItem("refreshToken", data.refresh);
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/admin/dashboard");
          return;
        } else {
          throw new Error(adminResponse.data.error || "Login error");
        }
      } catch (adminError) {
        // If not admin, try normal login
        const response = await axios.post(
          "http://localhost:8000/api/auth/login/",
          {
            email: formData.email,
            password: formData.password,
          }
        );
        if (response.data.error === false) {
          const { data } = response.data;
          localStorage.setItem("token", data.access);
          localStorage.setItem("refreshToken", data.refresh);
          localStorage.setItem("user", JSON.stringify(data.user));

          if (data.user.role === "admin") {
            navigate("/admin/dashboard");
          } else if (data.user.role === "teacher") {
            navigate("/teacher/modules");
          } else {
            navigate("/student/dashboard");
          }
        } else {
          throw new Error(response.data.error || "Login error");
        }
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || "An error occurred during login.");
      } else {
        setError(err.message || "Server connection error.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage({ type: "", text: "" });
    setResetLoading(true);

    try {
      await axios.post("http://localhost:8000/api/password-reset/", {
        email: resetEmail,
      });
      setResetMessage({
        type: "success",
        text: "A password reset email has been sent to your address.",
      });
      setResetEmail("");
    } catch (err) {
      setResetMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/" className="back-to-home">
          ← Back to Home
        </Link>
        <div className="login-header">
          <h2>
            Welcome to <span className="quizly-logo">Quizly</span>
          </h2>
          <p>Sign in to access your space</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <button
              type="button"
              className="forgot-password-button"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot password?
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>

      {showForgotPassword && (
        <div className="modal-overlay">
          <div className="forgot-password-modal">
            <button
              className="close-modal"
              onClick={() => setShowForgotPassword(false)}
            >
              ×
            </button>
            <h3>Forgot Password</h3>
            <p>Enter your email address to receive a password reset link.</p>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                className="modal-input"
                placeholder="Email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="modal-button"
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            {resetMessage.text && (
              <div
                className={`forgot-password-message ${resetMessage.type}`}
                style={{ marginTop: "1rem" }}
              >
                {resetMessage.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
