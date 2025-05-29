import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const navigate = useNavigate();

  // Check for remembered credentials on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberedPassword = localStorage.getItem("rememberedPassword");

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    if (rememberedPassword) {
      setPassword(rememberedPassword);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login/",
        {
          email: email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const token = response.data.data.access;
      localStorage.setItem("token", token);

      // Store credentials if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      const role = response.data.data.user.role;

      // Role-based redirection
      if (role === "teacher") {
        try {
          const modulesResponse = await axios.get(
            "http://localhost:8000/api/teacher/modules/check/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const hasModules = modulesResponse.data.has_modules;

          if (hasModules) {
            navigate("/teacher/modules");
          } else {
            navigate("/teacher-create-module");
          }
        } catch (modulesError) {
          console.error("Error checking modules:", modulesError);
          alert("Error checking modules. Please try again.");
        }
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "student") {
        try {
          const categoriesResponse = await axios.get(
            "http://localhost:8000/api/student/categories/check/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const hasCategories = categoriesResponse.data.has_modules;

          if (hasCategories) {
            navigate("/student/categories");
          } else {
            navigate("/student-create-category");
          }
        } catch (categoriesError) {
          console.error("Error checking categories:", categoriesError);
          alert("Error checking your categories. Please try again.");
        }
      } else {
        console.error("Unknown role:", role);
        navigate("/default-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(`Login failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);
      await axios.post("http://localhost:8000/api/auth/password/reset/", {
        email: forgotPasswordEmail,
      });

      setForgotPasswordMessage(
        "Password reset link has been sent to your email"
      );
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setForgotPasswordMessage("");
      }, 3000);
    } catch (error) {
      console.error("Forgot password error:", error);
      setForgotPasswordMessage(
        error.response?.data?.detail || "Failed to send reset link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/" className="back-to-home">
          ← Back to home
        </Link>
        <div className="login-header">
          <h2>
            Welcome back to <span className="quizly-logo">QUIZLY</span>
          </h2>
          <p>Sign in to access your quizzes and learning materials</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>
            <button
              type="button"
              className="forgot-password-button"
              onClick={() => setShowForgotPasswordModal(true)}
            >
              Forgot password?
            </button>
          </div>
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay">
          <div className="forgot-password-modal">
            <button
              className="close-modal"
              onClick={() => {
                setShowForgotPasswordModal(false);
                setForgotPasswordMessage("");
              }}
            >
              &times;
            </button>
            <h3>Reset Password</h3>
            <p>Enter your email address to receive a password reset link</p>
            <input
              type="email"
              placeholder="Your email address"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="modal-input"
            />
            {forgotPasswordMessage && (
              <p
                className={`forgot-password-message ${
                  forgotPasswordMessage.includes("sent") ? "success" : "error"
                }`}
              >
                {forgotPasswordMessage}
              </p>
            )}
            <button
              onClick={handleForgotPassword}
              className="modal-button"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
