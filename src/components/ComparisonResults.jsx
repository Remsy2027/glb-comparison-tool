import React from 'react';

const ComparisonResults = ({ results }) => {
  const getSummaryBadgeClass = (percentage) => {
    if (percentage < 1) return 'excellent';
    if (percentage < 5) return 'good';
    if (percentage < 15) return 'moderate';
    return 'significant';
  };

  const getSummaryText = (percentage) => {
    if (percentage < 1) {
      return `The models are visually identical with only ${percentage.toFixed(2)}% difference. This level of similarity is considered excellent for 3D model comparison.`;
    } else if (percentage < 5) {
      return `The models show a ${percentage.toFixed(2)}% difference, which is within acceptable limits. Minor variations may be present in materials or geometry.`;
    } else if (percentage < 15) {
      return `The models have a moderate ${percentage.toFixed(2)}% difference. Noticeable variations exist in materials, geometry, or lighting that may require attention.`;
    } else {
      return `The models show significant differences (${percentage.toFixed(2)}%). Major variations in geometry, materials, or textures are present.`;
    }
  };

  if (!results) return null;

  const badgeClass = getSummaryBadgeClass(results.percentage);
  const summaryText = getSummaryText(results.percentage);

  return (
    <div className="comparison-results">
      <div className="results-header">
        <h2 className="results-title">Comparison Results</h2>
      </div>
      
      <div className="results-content">
        <div className="comparison-images">
          <div className="image-container">
            <h3 className="image-label">Model 1</h3>
            <img 
              src={results.originalImage} 
              alt="Model 1" 
              className="result-image"
            />
          </div>
          
          <div className="image-container">
            <h3 className="image-label">Model 2</h3>
            <img 
              src={results.comparisonImage} 
              alt="Model 2" 
              className="result-image"
            />
          </div>
          
          <div className="image-container">
            <h3 className="image-label">Difference Visualization</h3>
            <img 
              src={results.diffImage} 
              alt="Difference Visualization" 
              className="result-image"
            />
          </div>
        </div>
        
        <div className="comparison-summary">
          <div className="diff-percentage">
            {results.percentage.toFixed(2)}%
          </div>
          <div className="summary-text">
            {summaryText}
          </div>
          <div className={`summary-badge ${badgeClass}`}>
            {badgeClass}
          </div>
          <div className="camera-view-info">
            <small>* Both models are compared using identical camera position and HDR lighting.</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonResults;