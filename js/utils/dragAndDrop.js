/**
 * Improved utility for handling drag and drop functionality
 * With better visual feedback and error handling
 */

/**
 * Setup drag and drop for a container
 * @param {HTMLElement} container - The drop zone container
 * @param {HTMLInputElement} fileInput - File input for manual selection
 * @param {Function} onFileLoaded - Callback for when file is loaded
 */
function setupDragAndDrop(container, fileInput, onFileLoaded) {
    // Check if required elements exist
    if (!container) {
        console.error('Drop zone container is required');
        return;
    }
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        container.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    container.addEventListener('drop', handleDrop, false);
    
    // Handle file input change if provided
    if (fileInput) {
        fileInput.addEventListener('change', handleFileInput, false);
    }
    
    /**
     * Prevent default behaviors
     * @param {Event} e - Event object
     */
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * Highlight drop zone
     */
    function highlight() {
        container.classList.add('active');
    }
    
    /**
     * Remove highlight from drop zone
     */
    function unhighlight() {
        container.classList.remove('active');
    }
    
    /**
     * Handle file drop
     * @param {DragEvent} e - Drag event
     */
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length === 0) {
            showError('No files were dropped');
            return;
        }
        
        if (files.length > 1) {
            showError('Please drop only one file at a time');
            return;
        }
        
        const file = files[0];
        handleFile(file);
    }
    
    /**
     * Handle file input change
     */
    function handleFileInput() {
        if (!fileInput.files || fileInput.files.length === 0) {
            return;
        }
        
        const file = fileInput.files[0];
        handleFile(file);
    }
    
    /**
     * Process the file
     * @param {File} file - The file object
     */
    function handleFile(file) {
        if (!file) return;
        
        // Check file type
        if (!file.name.toLowerCase().endsWith('.glb')) {
            showError('Please select a valid GLB file');
            return;
        }
        
        // Check file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            showError(`File is too large. Maximum size is ${formatFileSize(maxSize)}`);
            return;
        }
        
        // Show loading state
        showLoading();
        
        // Pass file to callback
        if (typeof onFileLoaded === 'function') {
            try {
                onFileLoaded(file);
            } catch (error) {
                console.error('Error in onFileLoaded callback:', error);
                showError('Error processing file: ' + error.message);
                hideLoading();
            }
        } else {
            console.error('onFileLoaded callback is not a function');
            hideLoading();
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    function showError(message) {
        console.error('Drag and drop error:', message);
        
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            alert(message);
        }
    }
    
    /**
     * Show loading state
     */
    function showLoading() {
        // Add loading class if not already active
        if (!container.classList.contains('loading')) {
            container.classList.add('loading');
        }
    }
    
    /**
     * Hide loading state
     */
    function hideLoading() {
        container.classList.remove('loading');
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
}