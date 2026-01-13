// Login.js - Updated for Railway deployment
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

// Base URL for your Railway backend
const API_BASE_URL = "https://hadsxk-production.up.railway.app";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("Attempting login with:", { username, password });
      
      const res = await fetch(`${API_BASE_URL}/api/login/`, {  // Changed endpoint
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      console.log("Login response status:", res.status);
      console.log("Login response data:", data);

      if (res.ok) {
        // Check for JWT tokens in response
        if (data.tokens && data.tokens.access) {
          // Store tokens
          localStorage.setItem("access_token", data.tokens.access);
          localStorage.setItem("refresh_token", data.tokens.refresh);
          
          // Store user info
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            login(data.user);
          }
          
          // Navigate to dashboard
          navigate("/");
          setSuccess("Login successful!");
        } else {
          setError("Login successful but no tokens in response");
          console.error("No tokens found in response:", data);
        }
      } else {
        // Handle specific error messages
        if (data.error) {
          setError(data.error);
        } else if (data.detail) {
          setError(data.detail);
        } else if (data.non_field_errors) {
          setError(data.non_field_errors[0]);
        } else {
          setError("Invalid credentials or server error");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!email || !email.includes('@')) {
      setError("Please enter a valid email");
      return;
    }

    if (!password || password.length < 4) { // Changed to 4 based on backend settings
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Attempting registration with:", { username, email });
      
      const res = await fetch(`${API_BASE_URL}/api/register/`, {  // Changed endpoint
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          level: "beginner"
        })
      });

      const data = await res.json();
      console.log("Register response:", data);

      if (res.status === 201) {
        // Registration successful - NO AUTO LOGIN
        setSuccess(data.message || "Registration successful! Please login with your credentials.");
        setError("");
        
        // Clear form and switch to login mode
        setUsername("");
        setEmail("");
        setPassword("");
        
        // Switch to login view
        setIsRegistering(false);
        
        // Show success message for 5 seconds
        setTimeout(() => {
          setSuccess("");
        }, 5000);
        
      } else {
        // Handle registration errors
        if (data.error) {
          setError(data.error);
        } else if (data.username) {
          setError(`Username: ${data.username[0]}`);
        } else if (data.email) {
          setError(`Email: ${data.email[0]}`);
        } else if (data.password) {
          setError(`Password: ${data.password[0]}`);
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (isRegistering) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>KByteX {isRegistering ? "Register" : "Login"}</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
          
          {isRegistering && (
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          )}
          
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={isRegistering ? 4 : 1} // Show min length for registration
          />
          
          {isRegistering && (
            <div className="password-hint">
              Password must be at least 4 characters
            </div>
          )}
          
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : (isRegistering ? "Register" : "Login")}
          </button>
        </form>
        
        <div className="auth-toggle">
          {isRegistering ? (
            <p>
              Already have an account?{" "}
              <span 
                onClick={() => !loading && setIsRegistering(false)} 
                className="toggle-link"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                Login here
              </span>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <span 
                onClick={() => !loading && setIsRegistering(true)} 
                className="toggle-link"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                Register here
              </span>
            </p>
          )}
        </div>
        
         
      </div>
    </div>
  );
}