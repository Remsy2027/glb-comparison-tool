// ReportService.js - Report generation utilities

export class ReportService {
    static generateReport({ originalStats, comparisonStats, comparisonResults }) {
      const reportHTML = this.createReportHTML(originalStats, comparisonStats, comparisonResults);
      this.downloadReport(reportHTML);
    }
  
    static createReportHTML(originalStats, comparisonStats, comparisonResults) {
      const timestamp = new Date().toLocaleString();
      const originalFileName = originalStats ? 'Model 1' : 'N/A';
      const comparisonFileName = comparisonStats ? 'Model 2' : 'N/A';
      
      const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
  
      const formatNumber = (num) => {
        return num ? num.toLocaleString() : 0;
      };
  
      return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GLB Comparison Report</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        line-height: 1.6;
        color: #1e293b;
        background-color: #f8fafc;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
      
      .header {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 2rem;
        border-radius: 1rem;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      
      .header p {
        font-size: 1.1rem;
        opacity: 0.9;
      }
      
      .section {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      }
      
      .section h2 {
        font-size: 1.5rem;
        color: #334155;
        margin-bottom: 1rem;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }
      
      .images-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
      }
      
      .image-container {
        text-align: center;
        background: #f8fafc;
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
      }
      
      .image-container h3 {
        font-size: 1.1rem;
        color: #475569;
        margin-bottom: 1rem;
      }
      
      .image-container img {
        max-width: 100%;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
      }
      
      .stat-card {
        background: #f8fafc;
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
      }
      
      .stat-card h3 {
        font-size: 1.1rem;
        color: #475569;
        margin-bottom: 1rem;
      }
      
      .stat-list {
        list-style: none;
      }
      
      .stat-list li {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .stat-list li:last-child {
        border-bottom: none;
      }
      
      .stat-label {
        color: #64748b;
      }
      
      .stat-value {
        font-weight: 600;
        color: #1e293b;
      }
      
      .comparison-result {
        text-align: center;
        padding: 2rem;
        background: linear-gradient(135deg, #f8fafc, #e2e8f0);
        border-radius: 1rem;
        border: 2px solid #e2e8f0;
      }
      
      .diff-percentage {
        font-size: 3rem;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 1rem;
      }
      
      .summary-text {
        font-size: 1.1rem;
        color: #475569;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.7;
      }
      
      .metadata {
        background: #f1f5f9;
        padding: 1rem;
        border-radius: 0.5rem;
        font-size: 0.9rem;
        color: #64748b;
        text-align: center;
        margin-top: 2rem;
      }
      
      .texture-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.5rem;
        margin-top: 1rem;
      }
      
      .texture-chip {
        background: #ddd6fe;
        color: #5b21b6;
        padding: 0.5rem;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        text-align: center;
        font-weight: 500;
      }
      
      @media (max-width: 768px) {
        .container {
          padding: 1rem;
        }
        
        .header h1 {
          font-size: 1.8rem;
        }
        
        .diff-percentage {
          font-size: 2rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>GLB Comparison Report</h1>
        <p>Advanced 3D Model Analysis & Comparison</p>
      </div>
      
      <div class="section">
        <h2>Comparison Results</h2>
        <div class="comparison-result">
          <div class="diff-percentage">${comparisonResults.percentage.toFixed(2)}%</div>
          <div class="summary-text">
            ${this.getSummaryText(comparisonResults.percentage)}
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Visual Comparison</h2>
        <div class="images-grid">
          <div class="image-container">
            <h3>Model 1</h3>
            <img src="${comparisonResults.originalImage}" alt="Model 1">
          </div>
          
          <div class="image-container">
            <h3>Model 2</h3>
            <img src="${comparisonResults.comparisonImage}" alt="Model 2">
          </div>
          
          <div class="image-container">
            <h3>Difference Visualization</h3>
            <img src="${comparisonResults.diffImage}" alt="Difference Visualization">
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Model Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Model 1</h3>
            <ul class="stat-list">
              <li><span class="stat-label">File Size:</span> <span class="stat-value">${formatBytes(originalStats?.fileSize || 0)}</span></li>
              <li><span class="stat-label">Vertices:</span> <span class="stat-value">${formatNumber(originalStats?.vertexCount || 0)}</span></li>
              <li><span class="stat-label">Triangles:</span> <span class="stat-value">${formatNumber(originalStats?.triangleCount || 0)}</span></li>
              <li><span class="stat-label">Materials:</span> <span class="stat-value">${formatNumber(originalStats?.materialCount || 0)}</span></li>
              <li><span class="stat-label">Textures:</span> <span class="stat-value">${formatNumber(originalStats?.textureCount || 0)}</span></li>
            </ul>
            ${originalStats?.textures?.length ? `
              <div class="texture-grid">
                ${originalStats.textures.map(([name, count]) => 
                  `<div class="texture-chip">${name}${count > 1 ? ` (×${count})` : ''}</div>`
                ).join('')}
              </div>
            ` : ''}
          </div>
          
          <div class="stat-card">
            <h3>Model 2</h3>
            <ul class="stat-list">
              <li><span class="stat-label">File Size:</span> <span class="stat-value">${formatBytes(comparisonStats?.fileSize || 0)}</span></li>
              <li><span class="stat-label">Vertices:</span> <span class="stat-value">${formatNumber(comparisonStats?.vertexCount || 0)}</span></li>
              <li><span class="stat-label">Triangles:</span> <span class="stat-value">${formatNumber(comparisonStats?.triangleCount || 0)}</span></li>
              <li><span class="stat-label">Materials:</span> <span class="stat-value">${formatNumber(comparisonStats?.materialCount || 0)}</span></li>
              <li><span class="stat-label">Textures:</span> <span class="stat-value">${formatNumber(comparisonStats?.textureCount || 0)}</span></li>
            </ul>
            ${comparisonStats?.textures?.length ? `
              <div class="texture-grid">
                ${comparisonStats.textures.map(([name, count]) => 
                  `<div class="texture-chip">${name}${count > 1 ? ` (×${count})` : ''}</div>`
                ).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <div class="metadata">
        Report generated on ${timestamp} | GLB Comparison Tool v2.0
      </div>
    </div>
  </body>
  </html>
      `;
    }
  
    static getSummaryText(percentage) {
      if (percentage < 1) {
        return `The models are visually identical with only ${percentage.toFixed(2)}% difference. This level of similarity is considered excellent for 3D model comparison.`;
      } else if (percentage < 5) {
        return `The models show a ${percentage.toFixed(2)}% difference, which is within acceptable limits. Minor variations may be present in materials or geometry.`;
      } else if (percentage < 15) {
        return `The models have a moderate ${percentage.toFixed(2)}% difference. Noticeable variations exist in materials, geometry, or lighting that may require attention.`;
      } else {
        return `The models show significant differences (${percentage.toFixed(2)}%). Major variations in geometry, materials, or textures are present.`;
      }
    }
  
    static downloadReport(html) {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `glb-comparison-report-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }