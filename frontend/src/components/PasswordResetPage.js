import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PasswordResetPage.css";

const PasswordResetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [errorDetail, setErrorDetail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      setIsLoading(true);
      const tokenParam = searchParams.get("token");

      if (!tokenParam) {
        setStatus("invalid");
        setErrorDetail("The reset link is missing the token parameter");
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/auth/password/reset/verify-token/${tokenParam}/`
        );

        if (response.data.valid) {
          setToken(tokenParam);
          setStatus("valid");
        } else {
          setStatus("invalid");
          setErrorDetail(
            response.data.message || "This link is no longer valid"
          );
        }
      } catch (error) {
        setStatus("invalid");
        setErrorDetail(
          error.response?.data?.message ||
            "We could not verify your reset link. Please try requesting a new one."
        );
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/password/reset/complete/`,
        { token, new_password: password }
      );
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "verifying") {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="verifying-message">
            <div className="loading-spinner"></div>
            <h3>Checking your reset link...</h3>
            <p>Please wait while we verify your password reset link.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="reset-container">
        <div className="reset-card error-card">
          <div className="error-content">
            <div className="error-icon">!</div>
            <h3>Invalid Reset Link</h3>
            <p className="error-description">
              {errorDetail || "This password reset link is not valid."}
            </p>
            <button
              onClick={() => navigate("/forgot-password")}
              className="primary-button"
            >
              Request New Reset Link
            </button>
            <p className="support-text">
              Need help? <a href="/contact-support">Contact support</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-container">
        <div className="reset-card success-card">
          <div className="success-content">
            <div className="success-icon">✓</div>
            <h3>Password Reset Successful!</h3>
            <p>Your password has been updated successfully.</p>
            <button
              onClick={() => navigate("/login")}
              className="primary-button"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2>Reset Your Password</h2>

        {error && (
          <div className="error-message">
            <div className="error-icon">!</div>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
              className="form-input"
              placeholder="Enter your new password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="8"
              className="form-input"
              placeholder="Confirm your new password"
            />
          </div>

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetPage;
