// pages/LandingPage.jsx - Updated version
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container">
          <nav className="landing-nav">
            <div className="nav-brand">
              <h1>AI Study Assistant</h1>
            </div>
            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/free-chat">Try Free</Link>
            </div>
            <div className="nav-auth">
              <Link to="/login" className="btn-login">Sign In</Link>
              <Link to="/login" className="btn-signup">Sign Up Free</Link> {/* Changed from /register to /login */}
            </div>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        {/* Hero Section */}
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
                <Link to="/login" className="btn-hero-secondary"> {/* Changed from /register to /login */}
                  ✨ Sign Up for More Features
                </Link>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Free to Start</span>
                </div>
                <div className="stat">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">AI Assistance</span>
                </div>
                <div className="stat">
                  <span className="stat-number">5M+</span>
                  <span className="stat-label">Free Tokens</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
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
                <p>Create stunning images from text descriptions. Perfect for visual learning.</p>
                <span className="feature-requires">Requires Sign Up</span>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📄</div>
                <h3>Document Analysis</h3>
                <p>Upload PDFs, Word docs, and images. Get AI-powered summaries and insights.</p>
                <span className="feature-requires">Requires Sign Up</span>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Study Tools</h3>
                <p>Flashcards, quizzes, and personalized study plans based on your needs.</p>
                <span className="feature-requires">Requires Sign Up</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="how-section">
          <div className="container">
            <h2>How It Works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Try for Free</h3>
                <p>Start chatting immediately without any registration. Perfect for quick questions.</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Sign Up Free</h3>
                <p>Create a free account to unlock more features and save your progress.</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Upgrade Anytime</h3>
                <p>Get premium features like image generation and document analysis when you need them.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <h2>Start Learning with AI Today</h2>
            <p>Join thousands of students who are learning smarter with AI assistance.</p>
            <div className="cta-buttons">
              <Link to="/free-chat" className="btn-cta-primary">
                🚀 Try Free Chat
              </Link>
              <Link to="/login" className="btn-cta-secondary"> {/* Changed from /register to /login */}
                ✨ Sign Up Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container">
          <p>© 2024 AI Study Assistant. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/login">Sign Up</Link> {/* Changed from /register to /login */}
            <a href="/free-chat">Free Chat</a>
            <a href="#features">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;