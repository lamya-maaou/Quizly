import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ResendVerification.css";

const ResendVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/resend-verification/",
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(
        response.data.message || "Verification email resent successfully"
      );
      setTimeout(
        () => navigate("/verify-email-notice", { state: { email } }),
        2000
      );
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to resend verification email"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="resend-verification-container">
      <h2>Resend Verification Email</h2>
      <form onSubmit={handleSubmit} className="resend-verification-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Resend Verification Email"}
        </button>
      </form>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <div className="back-to-login">
        <button onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    </div>
  );
};

export default ResendVerification;
