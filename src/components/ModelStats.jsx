import React from 'react';

export const ModelStats = ({ stats }) => {
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    return num ? num.toLocaleString() : 0;
  };

  if (!stats) return null;

  return (
    <div className="model-stats">
      <h3 className="stats-title">Model Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">File Size</div>
          <div className="stat-value">{formatBytes(stats.fileSize)}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Vertices</div>
          <div className="stat-value">{formatNumber(stats.vertexCount)}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Triangles</div>
          <div className="stat-value">{formatNumber(stats.triangleCount)}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Materials</div>
          <div className="stat-value">{formatNumber(stats.materialCount)}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Textures</div>
          <div className="stat-value">{formatNumber(stats.textureCount)}</div>
        </div>
      </div>
      
      {stats.textures && stats.textures.length > 0 && (
        <div className="texture-section">
          <div className="texture-title">Texture Details</div>
          <div className="texture-grid">
            {stats.textures.map(([name, count], index) => (
              <div key={index} className="texture-chip">
                {name} {count > 1 && `(×${count})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelStats;