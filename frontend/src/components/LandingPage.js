import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <nav className="navbar">
  <div className="logo-block">
    <span className="logo">QUIZLY</span>
    <span className="slogan">Quick Quizzes. Real Progress</span>
  </div>
  <div className="auth-buttons">
    <Link to="/login" className="login-btn">Login</Link>
    <Link to="/signup" className="signup-btn">Sign up</Link>
  </div>
</nav>



      
      <main className="hero-content">
        <div className="content-wrapper">
          <div className="content-card">
            <h2 className="tagline">Turn Study Materials into Smart Quizzes</h2>
            <p className="main-description">
              Upload your materials and get personalized quizzes. Save time while boosting retention.
            </p>
            
            <div className="value-props">
              <div className="prop-card">
                <div className="prop-icon">📚</div>
                <h3>Upload & Go</h3>
                <div className="prop-content">
                  <p><strong>Students:</strong> Review smarter, not harder. Upload your slides or textbooks and get focused questions.</p>
                  <p><strong>Teachers:</strong> Simplify your workflow. Turn documents into review tools effortlessly.</p>
                </div>
              </div>
              
              <div className="prop-card">
                <div className="prop-icon">⚡</div>
                <h3>Instant Results</h3>
                <div className="prop-content">
                  <p><strong>Students:</strong> Get quiz-ready in seconds. Perfect for quick reviews before exams.</p>
                  <p><strong>Teachers:</strong> Save time with AI-assisted quizzes. Reinforce important points quickly.</p>
                </div>
              </div>
              
              <div className="prop-card">
                <div className="prop-icon">📊</div>
                <h3>Progress Insights</h3>
                <div className="prop-content">
                  <p><strong>Students:</strong> Track your learning journey. See what you've mastered and where to improve.</p>
                  <p><strong>Teachers:</strong> Gain visibility on progress. Identify gaps and guide learners.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="footer">
        <p>© 2025 Quizly. Making learning smarter.</p>
      </footer>
    </div>
  );
};

export default LandingPage;