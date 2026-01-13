// components/DocumentUpload.jsx
import React, { useState, useCallback } from 'react';
import './DocumentUpload.css';

const DocumentUpload = ({ onUploadSuccess, onClose }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState(null);

 const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        setFile(null);
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/msword',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (!allowedTypes.includes(selectedFile.type) && 
          !selectedFile.name.match(/\.(pdf|docx|txt|doc|jpg|jpeg|png|xlsx|xls|csv|ppt|pptx)$/i)) {
        setError('File type not supported');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  // In your DocumentUpload.jsx or DocumentPage.jsx

const handleUpload = async () => {
  if (!file) return;
  
  setUploading(true);
  setError('');
  setProgress(0);
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('https://hadsxk-production.up.railway.app/api/upload-document/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Success
      setUploadedDoc(data.document);
      setProgress(100);
      
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } else {
      // Handle specific errors
      if (data.error === 'PDF analysis limit reached') {
        setError(
          <div>
            <strong>PDF Limit Reached!</strong>
            <p>You've used {data.used || 0} of {data.limit || 0} PDF analyses this month.</p>
            <p>Options:</p>
            <ul>
              <li>Upgrade your plan for more PDF analyses</li>
              <li>Wait until next month (resets on {data.reset_date || 'the 1st'})</li>
              <li>Contact support if you need immediate access</li>
            </ul>
            {data.upgrade_url && (
              <button 
                className="upgrade-btn"
                onClick={() => window.open(data.upgrade_url, '_blank')}
              >
                Upgrade Plan
              </button>
            )}
          </div>
        );
      } else {
        setError(data.error || 'Upload failed');
      }
    }
  } catch (err) {
    setError('Network error: ' + err.message);
  } finally {
    setUploading(false);
  }
};
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'txt': return '📋';
      case 'image': return '🖼️';
      case 'excel': return '📊';
      case 'ppt': return '📽️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="document-upload-modal">
      <div className="document-upload-content">
        <div className="upload-header">
          <h3>📄 Upload Document</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {!uploadedDoc ? (
          <>
            <div className="upload-area" 
                 onClick={() => document.getElementById('fileInput').click()}>
              <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.doc,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.ppt,.pptx"
              />
              
              {file ? (
                <div className="file-preview">
                  <div className="file-icon">{getFileIcon('pdf')}</div>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatFileSize(file.size)}</div>
                  </div>
                  <button 
                    className="change-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📁</div>
                  <p>Click to select a file</p>
                  <p className="file-types">PDF, DOCX, TXT, Images, Excel, PowerPoint</p>
                  <p className="file-limit">Max 50MB</p>
                </div>
              )}
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="upload-actions">
              <button 
                className="upload-btn"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading...
                  </>
                ) : 'Upload Document'}
              </button>
              
              {uploading && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="upload-success">
            <div className="success-icon">✅</div>
            <h4>Document Uploaded Successfully!</h4>
            <div className="document-details">
              <div className="detail-row">
                <span>File:</span>
                <span>{uploadedDoc.file_name}</span>
              </div>
              <div className="detail-row">
                <span>Type:</span>
                <span>{uploadedDoc.file_type.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span>Size:</span>
                <span>{uploadedDoc.file_size_mb} MB</span>
              </div>
              {uploadedDoc.page_count > 0 && (
                <div className="detail-row">
                  <span>Pages:</span>
                  <span>{uploadedDoc.page_count}</span>
                </div>
              )}
            </div>
            <p>You can now ask questions about this document.</p>
            <button className="close-success-btn" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;