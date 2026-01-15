// components/FreeChatApp.jsx - Updated version
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import "./ChatApp.css";

const FreeChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [signupSuggestion, setSignupSuggestion] = useState(null);
  const navigate = useNavigate(); // Add this

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Try anonymous chat endpoint
      const response = await fetch("https://hadsxk-production.up.railway.app/api/anonymous-chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          text: data.answer,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFreeTier: data.is_free_tier,
          model: data.model,
          provider: data.provider
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Show signup suggestion if available
        if (data.signup_suggestion) {
          setSignupSuggestion(data.signup_suggestion);
        }
      } else {
        // If anonymous chat fails, try the main endpoint without auth
        try {
          const fallbackResponse = await fetch("https://hadsxk-production.up.railway.app/api/ai-chat/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: input,
              subject: "General",
              difficulty: "Beginner"
            }),
          });

          const fallbackData = await fallbackResponse.json();

          if (fallbackData.success) {
            const aiMessage = {
              id: Date.now() + 1,
              text: fallbackData.answer,
              sender: "ai",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isFreeTier: true,
              model: fallbackData.provider,
              isAnonymous: true
            };
            setMessages(prev => [...prev, aiMessage]);

            if (fallbackData.upgrade_suggestion) {
              setSignupSuggestion({
                message: "✨ Unlock more features by signing up!",
                features: [
                  "Longer conversations",
                  "Image generation",
                  "Document analysis",
                  "Save chat history",
                  "Higher limits"
                ],
                signup_url: "/login", // Changed from /register to /login
                login_url: "/login"
              });
            }
          } else {
            throw new Error(fallbackData.error || "Chat failed");
          }
        } catch (fallbackError) {
          throw new Error(data.error || "Chat service unavailable");
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: `⚠️ ${error.message || "Service temporarily unavailable. Please try again."}`,
        sender: "system",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Suggest signup on error
      setSignupSuggestion({
        message: "Having issues? Sign up for more reliable access!",
        features: [
          "Priority access",
          "More stable service",
          "Image generation",
          "Document upload"
        ],
        signup_url: "/login", // Changed from /register to /login
        login_url: "/login"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSignupSuggestion(null);
  };

  const handleSignUpClick = () => {
    navigate("/login"); // Changed from /register to /login
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="chat-app">
      <div className="chat-header">
        <h2>Free AI Chat</h2>
        <div className="chat-info">
          <span className="model-badge">Free Tier</span>
          <span className="model-badge">Groq AI</span>
          <button className="btn-clear" onClick={clearChat}>
            Clear Chat
          </button>
        </div>
      </div>

      {/* Signup Suggestion Banner */}
      {signupSuggestion && (
        <div className="signup-banner">
          <div className="signup-content">
            <h4>{signupSuggestion.message}</h4>
            <ul>
              {signupSuggestion.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
            <div className="signup-buttons">
              <button className="btn-primary" onClick={handleSignUpClick}>
                Sign Up Free
              </button>
              <button className="btn-secondary" onClick={handleLoginClick}>
                Sign In
              </button>
            </div>
          </div>
          <button 
            className="close-banner" 
            onClick={() => setSignupSuggestion(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Chat Container */}
      <div className="chat-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to Free AI Chat! 🚀</h3>
            <p>Ask me anything! I'm here to help you learn and explore.</p>
            <div className="free-features">
              <h4>Free Features:</h4>
              <ul>
                <li>💬 Chat with AI for free</li>
                <li>⚡ Fast responses with Groq AI</li>
                <li>🎯 Help with study questions</li>
                <li>🔍 Basic information lookup</li>
              </ul>
              <div className="upgrade-cta">
                <p>Want more? <a href="/login">Sign up free</a> for:</p>
                <ul>
                  <li>🖼️ Image generation</li>
                  <li>📄 Document analysis</li>
                  <li>💾 Save chat history</li>
                  <li>📈 Higher limits</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender} ${msg.isError ? 'error' : ''}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {msg.sender === "user" ? "You" : 
                     msg.sender === "ai" ? "AI Assistant" : "System"}
                    {msg.model && <span className="model-tag"> ({msg.model})</span>}
                    {msg.isFreeTier && <span className="free-tag"> Free</span>}
                  </span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
                <div className="message-content">
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="message-header">
                  <span className="message-sender">AI Assistant</span>
                </div>
                <div className="message-content typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here... (Try: 'Explain quantum physics' or 'Help me with math homework')"
          disabled={isLoading}
          rows="3"
        />
        <div className="input-actions">
          <div className="input-info">
            <span className="free-indicator">✨ Free Chat • No Login Required</span>
            {messages.length > 0 && (
              <span className="message-count">{messages.length} messages</span>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="btn-send"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="quick-actions">
          <button 
            className="quick-btn"
            onClick={() => setInput("Explain quantum physics in simple terms")}
          >
            Quantum Physics
          </button>
          <button 
            className="quick-btn"
            onClick={() => setInput("Help me solve a math problem: 2x + 5 = 15")}
          >
            Math Help
          </button>
          <button 
            className="quick-btn"
            onClick={() => setInput("What are the benefits of signing up?")}
          >
            Sign Up Benefits
          </button>
          <button 
            className="quick-btn btn-upgrade"
            onClick={handleSignUpClick}
          >
            🔓 Unlock Premium
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreeChatApp;