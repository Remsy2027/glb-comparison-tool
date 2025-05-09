/**
 * Improved ModelComparator class
 * Handles the comparison of two 3D models with better error handling and UI feedback
 */
class ModelComparator {
    /**
     * Create a new ModelComparator
     * @param {Object} options - Comparison options
     */
    constructor(options = {}) {
        this.options = {
            threshold: 0.1,
            includeAlpha: false,
            ...options
        };
        
        // Find DOM elements
        this.diffCanvas = document.getElementById('diff-canvas');
        this.statsContainer = document.getElementById('comparison-stats');
        
        // Keep track of last result
        this.lastComparisonResult = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the comparator
     */
    init() {
        console.log('ModelComparator initialized with threshold:', this.options.threshold);
        
        // Ensure DOM elements exist
        if (!this.diffCanvas) {
            console.error('Diff canvas element not found');
        }
        
        if (!this.statsContainer) {
            console.error('Comparison stats container not found');
        }
    }
    
    /**
     * Compare two model viewers
     * @param {ModelViewer} viewer1 - First model viewer
     * @param {ModelViewer} viewer2 - Second model viewer
     * @param {number} threshold - Comparison threshold (0.0 to 1.0)
     * @returns {Promise<Object>} - Comparison result
     */
    async compareModels(viewer1, viewer2, threshold = this.options.threshold) {
        // Validate inputs
        if (!viewer1 || !viewer2) {
            throw new Error('Both model viewers are required for comparison');
        }
        
        if (!viewer1.hasModel() || !viewer2.hasModel()) {
            throw new Error('Both models must be loaded for comparison');
        }
        
        console.log(`Starting comparison with threshold: ${threshold}`);
        
        try {
            // Update threshold
            this.options.threshold = threshold;
            
            // Capture screenshots (with retry mechanism)
            let img1DataUrl, img2DataUrl;
            try {
                [img1DataUrl, img2DataUrl] = await Promise.all([
                    viewer1.captureScreenshot(),
                    viewer2.captureScreenshot()
                ]);
            } catch (error) {
                console.error('Error capturing screenshots, retrying...', error);
                // Wait a bit and retry
                await new Promise(resolve => setTimeout(resolve, 500));
                [img1DataUrl, img2DataUrl] = await Promise.all([
                    viewer1.captureScreenshot(),
                    viewer2.captureScreenshot()
                ]);
            }
            
            console.log('Screenshots captured successfully');
            
            // Load images
            const [img1, img2] = await Promise.all([
                this.loadImage(img1DataUrl),
                this.loadImage(img2DataUrl)
            ]);
            
            // Create canvases with same dimensions
            const width = Math.min(img1.width, img2.width);
            const height = Math.min(img1.height, img2.height);
            
            console.log(`Comparing images at ${width}x${height}`);
            
            // Setup canvas contexts
            const [canvas1, canvas2, diffCtx] = this.setupCanvases(width, height);
            
            // Draw images to canvases
            const ctx1 = canvas1.getContext('2d');
            const ctx2 = canvas2.getContext('2d');
            
            ctx1.drawImage(img1, 0, 0, width, height);
            ctx2.drawImage(img2, 0, 0, width, height);
            
            // Get image data
            const imageData1 = ctx1.getImageData(0, 0, width, height);
            const imageData2 = ctx2.getImageData(0, 0, width, height);
            const diffImageData = diffCtx.createImageData(width, height);
            
            // Compare images using pixelmatch
            console.log('Running pixelmatch comparison...');
            
            // Make sure pixelmatch is available
            if (typeof pixelmatch !== 'function') {
                throw new Error('pixelmatch library not found. Make sure it is properly loaded.');
            }
            
            const diffPixels = pixelmatch(
                imageData1.data,
                imageData2.data,
                diffImageData.data,
                width,
                height,
                { 
                    threshold: threshold,
                    includeAlpha: this.options.includeAlpha,
                    diffColorAlt: [255, 0, 0, 255], // Red highlights for differences
                    diffColor: [0, 255, 0, 255]      // Green for similar areas
                }
            );
            
            // Calculate metrics
            const totalPixels = width * height;
            const diffPercentage = (diffPixels / totalPixels) * 100;
            const similarityPercentage = 100 - diffPercentage;
            
            console.log(`Comparison complete: ${diffPixels} different pixels (${diffPercentage.toFixed(2)}%)`);
            
            // Display diff image
            diffCtx.putImageData(diffImageData, 0, 0);
            this.diffCanvas.style.display = 'block';
            
            // Store comparison result
            this.lastComparisonResult = {
                width,
                height,
                totalPixels,
                diffPixels,
                diffPercentage,
                similarityPercentage,
                threshold,
                img1DataUrl,
                img2DataUrl,
                diffCanvas: this.diffCanvas
            };
            
            // Display metrics
            this.displayMetrics(this.lastComparisonResult);
            
            return this.lastComparisonResult;
        } catch (error) {
            console.error('Error comparing models:', error);
            this.showError(error.message);
            throw error;
        }
    }
    
    /**
     * Load an image from a data URL
     * @param {string} dataUrl - Image data URL
     * @returns {Promise<HTMLImageElement>} - Image element
     */
    loadImage(dataUrl) {
        return new Promise((resolve, reject) => {
            if (!dataUrl || typeof dataUrl !== 'string') {
                return reject(new Error('Invalid image data URL'));
            }
            
            const img = new Image();
            
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('Failed to load image'));
            
            img.src = dataUrl;
        });
    }
    
    /**
     * Setup canvases for comparison
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {Array} - Array of canvas contexts
     */
    setupCanvases(width, height) {
        // Canvas for first image
        const canvas1 = document.createElement('canvas');
        canvas1.width = width;
        canvas1.height = height;
        
        // Canvas for second image
        const canvas2 = document.createElement('canvas');
        canvas2.width = width;
        canvas2.height = height;
        
        // Canvas for diff image
        if (this.diffCanvas) {
            this.diffCanvas.width = width;
            this.diffCanvas.height = height;
            const diffCtx = this.diffCanvas.getContext('2d');
            
            return [canvas1, canvas2, diffCtx];
        } else {
            // Create a temporary canvas if diffCanvas is not available
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            
            return [canvas1, canvas2, tempCanvas.getContext('2d')];
        }
    }
    
    /**
     * Display comparison metrics in the UI
     * @param {Object} result - Comparison result
     */
    displayMetrics(result) {
        if (!this.statsContainer) {
            console.error('Stats container not found');
            return;
        }
        
        const similarityClass = this.getSimilarityClass(result.similarityPercentage);
        
        this.statsContainer.innerHTML = `
            <div class="comparison-metric">
                <div class="metric-name">
                    <span class="material-icons">verified</span> Similarity
                </div>
                <div class="metric-value ${similarityClass}">${result.similarityPercentage.toFixed(2)}%</div>
            </div>
            
            <div class="comparison-metric">
                <div class="metric-name">
                    <span class="material-icons">difference</span> Difference
                </div>
                <div class="metric-value">${result.diffPercentage.toFixed(2)}%</div>
            </div>
            
            <div class="comparison-metric">
                <div class="metric-name">
                    <span class="material-icons">grid_3x3</span> Different Pixels
                </div>
                <div class="metric-value">${result.diffPixels.toLocaleString()} of ${result.totalPixels.toLocaleString()}</div>
            </div>
            
            <div class="comparison-metric">
                <div class="metric-name">
                    <span class="material-icons">aspect_ratio</span> Dimensions
                </div>
                <div class="metric-value">${result.width} × ${result.height} pixels</div>
            </div>
            
            <div class="metric-note">
                <p><strong>Color Key:</strong></p>
                <p><span style="color: #4caf50;">■</span> Green areas indicate similar pixels</p>
                <p><span style="color: #f44336;">■</span> Red areas indicate different pixels</p>
                <p><strong>Threshold:</strong> ${result.threshold} (lower values = more sensitive)</p>
            </div>
        `;
        
        // Enable the save comparison button if it exists
        const saveBtn = document.getElementById('save-comparison');
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }
    
    /**
     * Get CSS class based on similarity percentage
     * @param {number} similarityPercentage - Similarity percentage
     * @returns {string} - CSS class
     */
    getSimilarityClass(similarityPercentage) {
        if (similarityPercentage >= 90) {
            return 'similarity-high';
        } else if (similarityPercentage >= 70) {
            return 'similarity-medium';
        } else {
            return 'similarity-low';
        }
    }
    
    /**
     * Display an error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (!this.statsContainer) return;
        
        this.statsContainer.innerHTML = `
            <div class="error-message">
                <span class="material-icons">error</span>
                <strong>Error comparing models:</strong>
                <p>${message}</p>
            </div>
            <p>Please ensure both models are properly loaded and try again.</p>
        `;
        
        // Make sure the diff canvas is hidden
        if (this.diffCanvas) {
            this.diffCanvas.style.display = 'none';
        }
    }
    
    /**
     * Get the latest comparison result
     * @returns {Object|null} - Comparison result or null
     */
    getLastResult() {
        return this.lastComparisonResult;
    }
    
    /**
     * Save the comparison as a report
     * @returns {Object} - Report data
     */
    generateReport() {
        if (!this.lastComparisonResult) {
            throw new Error('No comparison has been performed yet');
        }
        
        const result = this.lastComparisonResult;
        const timestamp = new Date().toISOString();
        const formattedDate = timestamp.replace(/[:.]/g, '-').substring(0, 19);
        
        return {
            timestamp: timestamp,
            models: {
                model1: {
                    screenshot: result.img1DataUrl
                },
                model2: {
                    screenshot: result.img2DataUrl
                }
            },
            comparison: {
                width: result.width,
                height: result.height,
                totalPixels: result.totalPixels,
                diffPixels: result.diffPixels,
                diffPercentage: result.diffPercentage,
                similarityPercentage: result.similarityPercentage,
                threshold: result.threshold
            },
            diffImageUrl: this.diffCanvas ? this.diffCanvas.toDataURL('image/png') : null
        };
    }
    
    /**
     * Download the comparison report as JSON
     */
    downloadReport() {
        try {
            const report = this.generateReport();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `model-comparison-${timestamp}.json`;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            // Also download the diff image
            if (this.diffCanvas) {
                const imgUrl = this.diffCanvas.toDataURL('image/png');
                const imgA = document.createElement('a');
                imgA.href = imgUrl;
                imgA.download = `model-comparison-diff-${timestamp}.png`;
                imgA.style.display = 'none';
                
                document.body.appendChild(imgA);
                imgA.click();
                
                setTimeout(() => {
                    document.body.removeChild(imgA);
                }, 100);
            }
            
            // Show success notification
            if (typeof showNotification === 'function') {
                showNotification('Comparison report saved successfully!', 'success');
            } else {
                alert('Comparison report saved successfully!');
            }
            
        } catch (error) {
            console.error('Error downloading report:', error);
            
            if (typeof showNotification === 'function') {
                showNotification('Error saving comparison: ' + error.message, 'error');
            } else {
                alert('Error saving comparison: ' + error.message);
            }
        }
    }
}