// pages/LandingPage.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LandingPage.css";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container">
          <nav className="landing-nav">
            <div className="nav-brand">
              <h1>AI Study Assistant</h1>
            </div>
            <div className="nav-links">
              <Link to="/free-chat">Try Free Chat</Link>
              {isAuthenticated ? (
                <Link to="/chat">Dashboard</Link>
              ) : (
                <Link to="/login">Sign In / Up</Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <h1>AI-Powered Study Assistant</h1>
              <p className="hero-subtitle">
                Get instant help with homework, generate images, analyze documents, 
                and learn faster with our intelligent AI assistant.
              </p>
              <div className="hero-actions">
                <Link to="/free-chat" className="btn-hero-primary">
                  🚀 Try Free Chat Now
                </Link>
                <Link to="/login" className="btn-hero-secondary">
                  ✨ Sign Up for More Features
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="container">
            <h2>What You Can Do</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h3>Free AI Chat</h3>
                <p>Chat with AI instantly without signing up. Get help with any subject.</p>
                <Link to="/free-chat" className="feature-link">Try Now →</Link>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🖼️</div>
                <h3>Image Generation</h3>
                <p>Create stunning images from text descriptions.</p>
                <span className="feature-requires">Requires Account</span>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📄</div>
                <h3>Document Analysis</h3>
                <p>Upload PDFs, Word docs, and get AI-powered insights.</p>
                <span className="feature-requires">Requires Account</span>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Study Tools</h3>
                <p>Personalized study plans and learning assistance.</p>
                <span className="feature-requires">Requires Account</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container">
          <p>© 2024 AI Study Assistant</p>
          <div className="footer-links">
            <Link to="/free-chat">Free Chat</Link>
            <Link to="/login">Sign In / Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;