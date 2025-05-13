import React from 'react';

const ActionButtons = ({ 
  canCompare, 
  onCompare, 
  canDownload, 
  onDownload, 
  onResetCamera,
  isSyncEnabled,
  onToggleSync
}) => {
  console.log('ActionButtons render - isSyncEnabled:', isSyncEnabled); // Debug log
  
  return (
    <div className="action-buttons">
      <button 
        className="btn btn-secondary" 
        onClick={onResetCamera}
        disabled={!canCompare}
      >
        <span>🔄</span>
        Reset Cameras
      </button>
      
      <button 
        className={`btn ${isSyncEnabled ? 'btn-primary' : 'btn-secondary'}`}
        onClick={onToggleSync}
        disabled={!canCompare}
        style={{
          backgroundColor: isSyncEnabled ? '#3498db' : '#95a5a6',
          border: isSyncEnabled ? '2px solid #2980b9' : '2px solid #7f8c8d'
        }}
      >
        <span>{isSyncEnabled ? '🔗' : '⛓️‍💥'}</span>
        {isSyncEnabled ? 'Sync ON' : 'Sync OFF'}
      </button>
      
      <button 
        className="btn btn-primary" 
        onClick={onCompare}
        disabled={!canCompare}
      >
        <span>🔍</span>
        Compare Models
      </button>
      
      <button 
        className="btn btn-secondary" 
        onClick={onDownload}
        disabled={!canDownload}
      >
        <span>📊</span>
        Download Report
      </button>
    </div>
  );
};

export default ActionButtons;