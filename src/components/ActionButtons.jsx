import React from 'react';

const ActionButtons = ({ canCompare, onCompare, canDownload, onDownload }) => {
  return (
    <div className="action-buttons">
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