// pages/DocumentsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DocumentUpload from "../components/DocumentUpload";
import "../styles/DocumentPage.css";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [analyzeQuestion, setAnalyzeQuestion] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");

  // Fetch user's documents
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("https://hadsxk-production.up.railway.app/api/documents/", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      alert("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle document upload success
  const handleUploadSuccess = (data) => {
    setDocuments(prev => [data.document, ...prev]);
    setShowUploadModal(false);
    alert(`✅ Document "${data.document.file_name}" uploaded successfully!`);
  };

  // Delete a document
  const handleDeleteDocument = async (documentId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`https://hadsxk-production.up.railway.app/api/documents/${documentId}/delete/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        alert("Document deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete document");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to delete document");
    }
  };

  // Helper functions for error handling
  const showLimitModal = (data) => {
    const confirmUpgrade = window.confirm(
      `PDF analysis limit reached (${data.used}/${data.limit}).\n\n` +
      `You've used ${data.used} out of ${data.limit} PDF analyses this month.\n\n` +
      `Click OK to view upgrade options.`
    );
    
    if (confirmUpgrade) {
      navigate("/plans");
    }
  };

  const showApiKeyModal = () => {
    const setupApi = window.confirm(
      "API key required for document analysis.\n\n" +
      "You need to set up your FREE Groq API key to analyze documents.\n\n" +
      "Click OK to go to API setup page."
    );
    
    if (setupApi) {
      navigate("/profile");
    }
  };

  const showAnalysisModalHandler = (data, documentId, question) => {
    setAnalysisResults(data);
    setCurrentDocumentId(documentId);
    setCurrentQuestion(question);
    setShowAnalysisModal(true);
  };

  // Analyze a document with AI
  const handleAnalyzeDocument = async (documentId, question = "") => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("https://hadsxk-production.up.railway.app/api/analyze-document/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: documentId,
          question: question || "Summarize this document"
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Show analysis in a modal instead of navigating away
        showAnalysisModalHandler(data, documentId, question);
      } else {
        // Handle specific errors
        if (data.error && data.error.includes('limit reached')) {
          showLimitModal(data);
        } else if (data.error && data.error.includes('API key')) {
          showApiKeyModal();
        } else {
          alert(data.error || "Failed to analyze document");
        }
      }
    } catch (err) {
      console.error("Error analyzing document:", err);
      alert("Failed to analyze document. Please try again.");
    } finally {
      setAnalyzing(false);
      setSelectedDocument(null);
      setAnalyzeQuestion("");
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "pdf": return "📄";
      case "docx": return "📝";
      case "txt": return "📋";
      case "image": return "🖼️";
      case "excel": return "📊";
      case "ppt": return "📽️";
      default: return "📎";
    }
  };

  // Get file type display name
  const getFileTypeName = (fileType) => {
    switch (fileType) {
      case "pdf": return "PDF Document";
      case "docx": return "Word Document";
      case "txt": return "Text File";
      case "image": return "Image File";
      case "excel": return "Spreadsheet";
      case "ppt": return "Presentation";
      default: return "File";
    }
  };

  // Format analysis text with HTML
  const formatAnalysisText = (text) => {
    if (!text) return "";
    
    // Replace markdown-style formatting
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    formatted = `<p>${formatted}</p>`;
    
    // Convert numbered lists
    formatted = formatted.replace(/(\d+)\.\s+(.*?)(?=\n\d+\.|\n\n|$)/g, '<li>$2</li>');
    formatted = formatted.replace(/<li>(.*?)<\/li>/g, (match, content) => {
      return `<div class="list-item">${content}</div>`;
    });
    
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  if (loading) {
    return (
      <div className="documents-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-page">
      {/* Header */}
      <div className="documents-header">
        <h1>📁 My Documents</h1>
        <p>Upload and analyze PDFs, Word documents, text files, and more with AI</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-card">
          <div className="upload-icon">📤</div>
          <h3>Upload New Document</h3>
          <p>Supported formats: PDF, DOCX, TXT, Images, Excel, PowerPoint</p>
          <button 
            className="upload-btn-primary"
            onClick={() => setShowUploadModal(true)}
          >
            📄 Upload Document
          </button>
        </div>

        {/* Quick Stats */}
        <div className="stats-card">
          <h3>📊 Document Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{documents.length}</div>
              <div className="stat-label">Total Documents</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {documents.filter(d => d.file_type === "pdf").length}
              </div>
              <div className="stat-label">PDF Files</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {formatFileSize(documents.reduce((total, doc) => total + (doc.file_size || 0), 0))}
              </div>
              <div className="stat-label">Total Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="documents-section">
        <div className="section-header">
          <h2>Your Documents ({documents.length})</h2>
          {documents.length > 0 && (
            <button 
              className="refresh-btn"
              onClick={fetchDocuments}
              title="Refresh documents"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No documents yet</h3>
            <p>Upload your first document to start analyzing with AI</p>
            <button 
              className="upload-btn-secondary"
              onClick={() => setShowUploadModal(true)}
            >
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-card-header">
                  <div className="file-icon">{getFileIcon(doc.file_type)}</div>
                  <div className="document-info">
                    <h4 className="document-title" title={doc.file_name}>
                      {doc.file_name.length > 40 
                        ? doc.file_name.substring(0, 40) + "..." 
                        : doc.file_name}
                    </h4>
                    <div className="document-meta">
                      <span className="file-type">{getFileTypeName(doc.file_type)}</span>
                      <span className="separator">•</span>
                      <span className="file-size">{formatFileSize(doc.file_size)}</span>
                      {doc.page_count > 0 && (
                        <>
                          <span className="separator">•</span>
                          <span className="page-count">{doc.page_count} pages</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="document-card-body">
                  <div className="upload-date">
                    <span className="date-label">Uploaded:</span>
                    <span className="date-value">{formatDate(doc.uploaded_at)}</span>
                  </div>
                  
                  {doc.preview && (
                    <div className="document-preview">
                      <p className="preview-label">Preview:</p>
                      <p className="preview-text">{doc.preview}</p>
                    </div>
                  )}
                </div>

                <div className="document-card-actions">
                  <button 
                    className="action-btn analyze-btn"
                    onClick={() => {
                      setSelectedDocument(doc);
                      setAnalyzeQuestion("");
                    }}
                    title="Analyze with AI"
                  >
                    🤖 Analyze
                  </button>
                  
                  <button 
                    className="action-btn chat-btn"
                    onClick={() => handleAnalyzeDocument(doc.id, "")}
                    title="Chat about this document"
                  >
                    💬 Chat
                  </button>
                  
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteDocument(doc.id, doc.file_name)}
                    title="Delete document"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUpload
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Analyze Modal */}
      {selectedDocument && (
        <div className="analyze-modal">
          <div className="analyze-modal-content">
            <div className="analyze-modal-header">
              <h3>🤖 Analyze Document</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setSelectedDocument(null)}
              >
                ×
              </button>
            </div>
            
            <div className="analyze-modal-body">
              <div className="selected-document-info">
                <div className="selected-file-icon">
                  {getFileIcon(selectedDocument.file_type)}
                </div>
                <div>
                  <h4>{selectedDocument.file_name}</h4>
                  <p>{getFileTypeName(selectedDocument.file_type)} • {formatFileSize(selectedDocument.file_size)}</p>
                </div>
              </div>

              <div className="question-input">
                <label htmlFor="analyze-question">
                  Ask a specific question (optional):
                </label>
                <textarea
                  id="analyze-question"
                  placeholder="e.g., 'Summarize the main points', 'What are the key findings?', 'Explain the methodology'..."
                  value={analyzeQuestion}
                  onChange={(e) => setAnalyzeQuestion(e.target.value)}
                  rows={4}
                />
                <div className="question-examples">
                  <p className="examples-label">Try asking:</p>
                  <div className="example-tags">
                    <button 
                      className="example-tag"
                      onClick={() => setAnalyzeQuestion("Summarize the main points")}
                    >
                      Summarize main points
                    </button>
                    <button 
                      className="example-tag"
                      onClick={() => setAnalyzeQuestion("What are the key findings?")}
                    >
                      Key findings
                    </button>
                    <button 
                      className="example-tag"
                      onClick={() => setAnalyzeQuestion("Explain the methodology")}
                    >
                      Explain methodology
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="analyze-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setSelectedDocument(null)}
              >
                Cancel
              </button>
              <button 
                className="analyze-submit-btn"
                onClick={() => handleAnalyzeDocument(selectedDocument.id, analyzeQuestion)}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <span className="spinner-small"></span>
                    Analyzing...
                  </>
                ) : "Start Analysis"}
              </button>
            </div>
          </div>
        </div>
      )}

{/* Analysis Results Modal */}
{showAnalysisModal && analysisResults && (
  <div className="analysis-modal-overlay" onClick={(e) => {
    if (e.target.className === "analysis-modal-overlay") {
      setShowAnalysisModal(false);
      setAnalysisResults(null);
    }
  }}>
    <div className="analysis-modal">
      <div className="analysis-modal-header">
        <h3>📊 Document Analysis Results</h3>
        <button 
          className="close-analysis-modal"
          onClick={() => {
            setShowAnalysisModal(false);
            setAnalysisResults(null);
          }}
        >
          ×
        </button>
      </div>
      
      <div className="analysis-modal-content">
        {/* Document Info */}
        <div className="analysis-document-info">
          <div className="analysis-file-icon">
            {getFileIcon(documents.find(d => d.id === currentDocumentId)?.file_type)}
          </div>
          <div>
            <h4>{documents.find(d => d.id === currentDocumentId)?.file_name}</h4>
            {currentQuestion && (
              <p className="analysis-question">
                <strong>Question:</strong> {currentQuestion}
              </p>
            )}
          </div>
        </div>

        {/* Analysis Stats */}
        <div className="analysis-stats">
          <div className="stat-badge">
            <span className="stat-label">Provider:</span>
            <span className="stat-value">{analysisResults.summary?.provider || "AI"}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">Tokens:</span>
            <span className="stat-value">{analysisResults.summary?.tokens_used || "N/A"}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{analysisResults.summary?.response_time_ms || 0}ms</span>
          </div>
          {analysisResults.summary?.using_system_key && (
            <div className="stat-badge system-key">
              <span className="stat-label">Using System Key</span>
            </div>
          )}
        </div>

        {/* Analysis Content */}
        <div className="analysis-content-container">
          {analysisResults.formatted_analysis?.type === "question_answer" ? (
            <div className="question-answer-analysis">
              <div className="answer-section">
                <h4>Answer:</h4>
                <div className="answer-content">
                  {formatAnalysisText(analysisResults.analysis)}
                </div>
              </div>
            </div>
          ) : analysisResults.formatted_analysis?.type === "structured_analysis" ? (
            <div className="structured-analysis">
              {analysisResults.formatted_analysis.sections?.map((section, index) => (
                <div key={index} className="analysis-section">
                  <h4>{section.title || `Section ${index + 1}`}</h4>
                  <div className="section-content">
                    {formatAnalysisText(section.content)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="plain-analysis">
              <h4>Analysis:</h4>
              <div className="analysis-text">
                {formatAnalysisText(analysisResults.analysis)}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - FIXED: Now visible and accessible */}
        <div className="analysis-actions">
          <button 
            className="copy-analysis-btn"
            onClick={() => {
              navigator.clipboard.writeText(analysisResults.analysis);
              alert("Analysis copied to clipboard!");
            }}
          >
            📋 Copy Analysis
          </button>
          
          <button 
            className="chat-about-btn"
            onClick={() => {
              // Navigate to chat with the analysis as context
              navigate("/", {
                state: {
                  documentAnalysis: {
                    documentId: currentDocumentId,
                    documentName: documents.find(d => d.id === currentDocumentId)?.file_name,
                    analysis: analysisResults.analysis,
                    question: currentQuestion
                  }
                }
              });
              setShowAnalysisModal(false);
            }}
          >
            💬 Continue in Chat
          </button>
          
          <button 
            className="new-analysis-btn"
            onClick={() => {
              setShowAnalysisModal(false);
              setAnalysisResults(null);
              // Reopen analyze modal for same document
              const doc = documents.find(d => d.id === currentDocumentId);
              if (doc) {
                setSelectedDocument(doc);
              }
            }}
          >
            🔄 New Analysis
          </button>
          
          {/* Add Close Button at bottom too */}
          <button 
            className="close-bottom-btn"
            onClick={() => {
              setShowAnalysisModal(false);
              setAnalysisResults(null);
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default DocumentsPage;