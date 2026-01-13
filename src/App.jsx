// App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Add this
import { useAuth } from "./context/AuthContext"; // Add this
import ChatApp from "./components/ChatApp";
import Login from "./pages/Login"; // This should now work
import Profile from "./pages/profile";
import DocumentsPage from "./pages/DocumentPage";
import DocumentUpload from "./components/DocumentUpload"; 
import "./styles/Header.css";
import Header from "./components/Header";

// Create a wrapper component that uses AuthContext
function AppContent() {
  const { isAuthenticated, logout } = useAuth();
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
      const res = await fetch("https://hadsxk-production.up.railway.app/api/clear-memory/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return (
      <>
        <Header 
          onLogout={logout} // Use logout from AuthContext
          onClearChat={clearMemory} 
        />
        {children}
        
        {/* Document Upload Modal - still available */}
        {showDocumentUpload && (
          <DocumentUpload
            onUploadSuccess={handleDocumentUploadSuccess}
            onClose={() => setShowDocumentUpload(false)}
          />
        )}
      </>
    );
  };

  return (
    <div className="app">
      <Routes>
        {/* Public route - Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={
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
        
        {/* Add Documents Page Route */}
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
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
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