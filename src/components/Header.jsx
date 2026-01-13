import { useNavigate } from "react-router-dom";
import "../styles/Header.css";
import logo from "../assets/KikiB.png";

export default function Header({ onLogout, onClearChat }) {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="header-left">
        <img 
          src={logo} 
          alt="KikiByte" 
          className="logo-img" 
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
        <span className="logo-text"> </span>
      </div>

      <div className="header-right">
        {/* Navigation Buttons */}
        <button 
          className="nav-btn"
          onClick={() => navigate("/")}
          title="Chat with AI"
        >
          💬 Chat
        </button>
        
        <button 
          className="nav-btn"
          onClick={() => navigate("/documents")}
          title="Manage Documents"
        >
          📁 Documents
        </button>
        
        <button 
          className="nav-btn"
          onClick={() => navigate("/profile")}
          title="Account Settings"
        >
          ⚙️  
        </button>

        {/* Actions */}
 

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}