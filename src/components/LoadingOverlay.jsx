import React from 'react';

const LoadingOverlay = ({ message }) => {
  if (!message) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">{message}</div>
    </div>
  );
};

export default LoadingOverlay;