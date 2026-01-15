// App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ChatApp from "./components/ChatApp";
import FreeChatApp from "./components/FreeChatApp";
import Login from "./pages/Login"; // This handles both login and registration
import Profile from "./pages/profile";
import DocumentsPage from "./pages/DocumentPage";
import DocumentUpload from "./components/DocumentUpload"; 
import LandingPage from "./pages/LandingPage";
import "./styles/Header.css";
import Header from "./components/Header";

// Create a wrapper component that uses AuthContext
function AppContent() {
  const { isAuthenticated, logout, user } = useAuth();
  const [resetTrigger, setResetTrigger] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  // Fetch user documents when authenticated
  useEffect(() => {
    const fetchUserDocuments = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch("https://hadsxk-production.up.railway.app/api/documents/", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUploadedDocuments(data.documents || []);
          }
        } catch (err) {
          console.error("Error fetching documents:", err);
        }
      }
    };

    fetchUserDocuments();
  }, [isAuthenticated]);

  const clearMemory = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("You need to be logged in to clear chat history");
        return;
      }

      const res = await fetch("https://hadsxk-production.up.railway.app/api/clear-memory/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      alert(data.message);
      setResetTrigger(prev => !prev);
    } catch (err) {
      console.error(err);
      alert("Failed to clear chat");
    }
  };

  const handleDocumentUploadSuccess = (data) => {
    setUploadedDocuments(prev => [data.document, ...prev]);
    setShowDocumentUpload(false);
    alert(`✅ Document "${data.document.file_name}" uploaded successfully!`);
    fetchUserDocuments();
  };

  const fetchUserDocuments = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("https://hadsxk-production.up.railway.app/api/documents/", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  // Protected Route component for authenticated-only features
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return (
      <>
        <Header 
          onLogout={logout}
          onClearChat={clearMemory} 
          user={user}
        />
        {children}
        
        {/* Document Upload Modal */}
        {showDocumentUpload && (
          <DocumentUpload
            onUploadSuccess={handleDocumentUploadSuccess}
            onClose={() => setShowDocumentUpload(false)}
          />
        )}
      </>
    );
  };

  // Public Header for free chat
  const PublicHeader = () => {
    const { isAuthenticated } = useAuth();
    
    return (
      <header className="header">
        <div className="header-left">
          <h1>AI Study Assistant</h1>
        </div>
        <div className="header-right">
          {isAuthenticated ? (
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/'}
            >
              Go to Dashboard
            </button>
          ) : (
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/login'}
            >
              Sign In / Up
            </button>
          )}
        </div>
      </header>
    );
  };

  return (
    <div className="app">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/free-chat" element={
          <>
            <PublicHeader />
            <FreeChatApp />
          </>
        } />
        <Route path="/login" element={<Login />} />
        {/* No /register route needed - handled in Login.js */}
        
        {/* Protected routes - require authentication */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatApp 
              resetTrigger={resetTrigger} 
              onDocumentUploadClick={() => setShowDocumentUpload(true)}
              uploadedDocuments={uploadedDocuments}
              onRefreshDocuments={fetchUserDocuments}
            />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile 
              uploadedDocuments={uploadedDocuments}
              onRefreshDocuments={fetchUserDocuments}
            />
          </ProtectedRoute>
        } />
        
        <Route path="/documents" element={
          <ProtectedRoute>
            <DocumentsPage 
              uploadedDocuments={uploadedDocuments}
              onRefreshDocuments={fetchUserDocuments}
              onUploadDocument={() => setShowDocumentUpload(true)}
            />
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;