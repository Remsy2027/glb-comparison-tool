import React, { useRef, useState } from 'react';

const ModelUploader = ({ label, onFileSelect, file }) => {
  const fileInputRef = useRef();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.toLowerCase().endsWith('.glb')) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="model-uploader">
      <div className="uploader-header">
        <h2 className="uploader-label">{label}</h2>
        <span className="uploader-icon">🎯</span>
      </div>
      
      <div className="file-input-wrapper">
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb"
          className="file-input"
          onChange={handleFileChange}
        />
        
        <div
          className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="drop-icon">📁</div>
          <div className="drop-text">
            {file ? file.name : 'Choose a GLB file'}
          </div>
          <div className="drop-subtext">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or drag and drop here'}
          </div>
        </div>
        
        {file && (
          <div className="file-selected">
            <span>✅</span>
            <span>File loaded successfully</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelUploader;