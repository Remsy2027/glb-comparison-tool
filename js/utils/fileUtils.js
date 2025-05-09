/**
 * Improved utility functions for file handling
 * With better error handling and performance optimizations
 */

/**
 * Read a file as array buffer
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} - File contents as array buffer
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        // Validate file
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }
        
        const reader = new FileReader();
        
        // Setup success handler
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        
        // Setup error handler
        reader.onerror = function(e) {
            console.error('FileReader error:', e);
            reject(new Error('Error reading file: ' + (e.target.error ? e.target.error.message : 'Unknown error')));
        };
        
        // Setup progress handler
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                console.log(`Loading file: ${Math.round(percentComplete)}%`);
            }
        };
        
        // Read the file
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Read a file as text
 * @param {File} file - The file to read
 * @returns {Promise<string>} - File contents as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        // Validate file
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        
        reader.onerror = function(e) {
            console.error('FileReader error:', e);
            reject(new Error('Error reading file: ' + (e.target.error ? e.target.error.message : 'Unknown error')));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Read a file as data URL
 * @param {File} file - The file to read
 * @returns {Promise<string>} - File contents as data URL
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        // Validate file
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        
        reader.onerror = function(e) {
            console.error('FileReader error:', e);
            reject(new Error('Error reading file: ' + (e.target.error ? e.target.error.message : 'Unknown error')));
        };
        
        reader.readAsDataURL(file);
    });
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

/**
 * Download data as a file
 * @param {string} filename - Name of the file
 * @param {Blob|string} data - Data to download
 * @param {string} type - MIME type
 */
function downloadFile(filename, data, type = 'application/octet-stream') {
    try {
        // Create blob from data if it's a string
        const blob = typeof data === 'string' 
            ? new Blob([data], { type }) 
            : data;
        
        // Create object URL
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        // Add to document, click, then remove
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a delay
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        return true;
    } catch (error) {
        console.error('Error downloading file:', error);
        
        if (typeof showNotification === 'function') {
            showNotification('Error saving file: ' + error.message, 'error');
        } else {
            alert('Error saving file: ' + error.message);
        }
        
        return false;
    }
}

/**
 * Extract filename without extension
 * @param {string} filename - Filename with extension
 * @returns {string} - Filename without extension
 */
function getBaseFilename(filename) {
    if (!filename) return '';
    return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Get file extension
 * @param {string} filename - Filename with extension
 * @returns {string} - File extension (without dot)
 */
function getFileExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Check if file is a GLB
 * @param {File} file - File to check
 * @returns {boolean} - True if file is a GLB
 */
function isGlbFile(file) {
    if (!file) return false;
    
    // Check extension
    const extension = getFileExtension(file.name);
    if (extension !== 'glb') return false;
    
    // Check MIME type if available
    if (file.type && file.type !== 'model/gltf-binary' && 
        file.type !== 'application/octet-stream') {
        console.warn(`File has GLB extension but unexpected MIME type: ${file.type}`);
    }
    
    return true;
}

/**
 * Create a timestamp string for filenames
 * @returns {string} - Timestamp string (YYYY-MM-DD-HH-MM-SS)
 */
function getTimestampString() {
    const now = new Date();
    return now.toISOString()
        .replace(/T/, '-')
        .replace(/\..+/, '')
        .replace(/:/g, '-');
}

/**
 * Create a filename with timestamp
 * @param {string} baseName - Base filename
 * @param {string} extension - File extension (without dot)
 * @returns {string} - Filename with timestamp
 */
function createTimestampedFilename(baseName, extension) {
    const timestamp = getTimestampString();
    return `${baseName}-${timestamp}.${extension}`;
}

/**
 * Save JSON data to file
 * @param {Object} data - JSON data
 * @param {string} filename - Filename
 * @returns {boolean} - Success state
 */
function saveJsonFile(data, filename) {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        return downloadFile(filename, jsonString, 'application/json');
    } catch (error) {
        console.error('Error saving JSON file:', error);
        
        if (typeof showNotification === 'function') {
            showNotification('Error saving JSON: ' + error.message, 'error');
        }
        
        return false;
    }
}

/**
 * Save canvas as image
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} filename - Filename
 * @param {string} type - Image type (image/png, image/jpeg)
 * @param {number} quality - JPEG quality (0-1)
 * @returns {boolean} - Success state
 */
function saveCanvasAsImage(canvas, filename, type = 'image/png', quality = 0.9) {
    try {
        // Convert canvas to data URL
        const dataUrl = type === 'image/jpeg' 
            ? canvas.toDataURL(type, quality)
            : canvas.toDataURL(type);
        
        // Convert data URL to blob
        const binaryString = atob(dataUrl.split(',')[1]);
        const len = binaryString.length;
        const arr = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
            arr[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([arr], { type });
        
        // Download the blob
        return downloadFile(filename, blob, type);
    } catch (error) {
        console.error('Error saving canvas as image:', error);
        
        if (typeof showNotification === 'function') {
            showNotification('Error saving image: ' + error.message, 'error');
        }
        
        return false;
    }
}