import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./VerifyEmailNotice.css";

const VerifyEmailNotice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const email = searchParams.get("email");
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const expired = searchParams.get("expired");

  let content;

  if (success) {
    content = (
      <div className="success-message">
        <h2>Email Verified Successfully!</h2>
        <p>
          Your email address <strong>{email}</strong> has been successfully
          verified.
        </p>
        <p>You can now log in to your account.</p>
        <button onClick={() => navigate("/login")} className="btn btn-primary">
          Go to Login
        </button>
      </div>
    );
  } else if (expired) {
    content = (
      <div className="warning-message">
        <h2>Verification Link Expired</h2>
        <p>The verification link has expired.</p>
        <Link
          to="/resend-verification"
          state={{ email }}
          className="btn btn-primary"
        >
          Resend Verification Email
        </Link>
      </div>
    );
  } else if (error) {
    content = (
      <div className="error-message">
        <h2>Verification Failed</h2>
        <p>The verification link is invalid or has already been used.</p>
        <Link
          to="/resend-verification"
          state={{ email }}
          className="btn btn-primary"
        >
          Try Again
        </Link>
      </div>
    );
  } else {
    // Cas par défaut (quand on arrive directement sur la page)
    content = (
      <div className="info-message">
        <h2>Verify Your Email Address</h2>
        <p>
          We've sent a verification link to{" "}
          <strong>{email || "your email address"}</strong>.
        </p>
        <p>
          Please check your inbox and click the link to verify your account.
        </p>

        <div className="resend-section">
          <p>Didn't receive the email?</p>
          <Link
            to="/resend-verification"
            state={{ email }}
            className="resend-link"
          >
            Click here to resend verification email
          </Link>
        </div>
      </div>
    );
  }

  return <div className="verify-email-container">{content}</div>;
};

export default VerifyEmailNotice;
