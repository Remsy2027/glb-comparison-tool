/**
 * Complete utility functions for UI operations
 * For the GLB Model Comparison Tool
 */

/**
 * Display model statistics in a container
 * @param {string} containerId - ID of the container element
 * @param {Object} stats - Model statistics
 */
function displayModelStats(containerId, stats) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    
    // Create a nicer UI for stats
    container.innerHTML = `
        <div class="stats-container">
            <div class="stat-item">
                <span class="stat-label">File name</span>
                <span class="stat-value" title="${stats.fileName}">${truncateFilename(stats.fileName, 20)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">File size</span>
                <span class="stat-value">${stats.fileSize}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Vertices</span>
                <span class="stat-value">${stats.vertices.toLocaleString()}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Triangles</span>
                <span class="stat-value">${stats.triangles.toLocaleString()}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Materials</span>
                <span class="stat-value">${stats.materials}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Textures</span>
                <span class="stat-value">${stats.textures}</span>
            </div>
        </div>
    `;
}

/**
 * Truncate a filename if it's too long
 * @param {string} filename - Filename to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated filename
 */
function truncateFilename(filename, maxLength = 20) {
    if (!filename) return '';
    
    if (filename.length <= maxLength) return filename;
    
    // Get extension
    const lastDotIndex = filename.lastIndexOf('.');
    let extension = '';
    let name = filename;
    
    if (lastDotIndex !== -1) {
        extension = filename.substring(lastDotIndex);
        name = filename.substring(0, lastDotIndex);
    }
    
    // Calculate how many characters to keep
    const charsToKeep = maxLength - extension.length - 3; // 3 for "..."
    if (charsToKeep < 1) {
        // Extension is too long, just truncate the whole thing
        return filename.substring(0, maxLength - 3) + '...';
    }
    
    // Truncate and add extension
    return name.substring(0, charsToKeep) + '...' + extension;
}

/**
 * Show a notification message
 * @param {string} message - Message to display
 * @param {string} type - Message type (info, success, warning, error)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    
    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        
        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                }
                
                .notification {
                    margin-bottom: 10px;
                    padding: 15px 20px;
                    border-radius: 4px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    color: white;
                    min-width: 280px;
                    max-width: 400px;
                    display: flex;
                    align-items: flex-start;
                    transform: translateX(100%);
                    opacity: 0;
                    animation: slide-in 0.3s forwards;
                }
                
                @keyframes slide-in {
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .notification.info {
                    background-color: #3f51b5;
                }
                
                .notification.success {
                    background-color: #4caf50;
                }
                
                .notification.warning {
                    background-color: #ff9800;
                }
                
                .notification.error {
                    background-color: #f44336;
                }
                
                .notification-content {
                    flex: 1;
                    padding-right: 10px;
                }
                
                .notification-close {
                    cursor: pointer;
                    font-weight: bold;
                    opacity: 0.7;
                    font-size: 1.2rem;
                    transition: opacity 0.2s;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    let icon = '';
    switch (type) {
        case 'info':
            icon = 'info';
            break;
        case 'success':
            icon = 'check_circle';
            break;
        case 'warning':
            icon = 'warning';
            break;
        case 'error':
            icon = 'error';
            break;
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            ${icon ? `<span class="material-icons">${icon}</span> ` : ''}
            ${message}
        </div>
        <span class="notification-close">&times;</span>
    `;
    container.appendChild(notification);
    
    // Setup close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode === container) {
                container.removeChild(notification);
            }
        }, 300);
    });
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode === container) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode === container) {
                        container.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }
    
    // Also log to console
    const consoleMethod = type === 'error' ? 'error' : 
                          type === 'warning' ? 'warn' : 'log';
    console[consoleMethod](`Notification (${type}): ${message}`);
    
    return notification;
}

/**
 * Toggle button state
 * @param {string} buttonId - ID of the button
 * @param {boolean} enabled - Whether to enable the button
 */
function toggleButton(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error(`Button not found: ${buttonId}`);
        return;
    }
    
    button.disabled = !enabled;
    
    // Add visual feedback
    if (enabled) {
        button.classList.remove('disabled');
    } else {
        button.classList.add('disabled');
    }
}

/**
 * Set the value of an input element
 * @param {string} inputId - ID of the input element
 * @param {*} value - Value to set
 */
function setInputValue(inputId, value) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.error(`Input element not found: ${inputId}`);
        return;
    }
    
    if (input.type === 'checkbox') {
        input.checked = !!value;
    } else {
        input.value = value;
    }
    
    // Dispatch change event
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
}

/**
 * Show loading spinner in a container
 * @param {string} containerId - ID of the container element
 * @param {string} message - Optional loading message
 */
function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    
    // Create loading element
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-container';
    loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            .loading-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background-color: rgba(255, 255, 255, 0.8);
                z-index: 1000;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(0, 0, 0, 0.1);
                border-radius: 50%;
                border-left-color: #3f51b5;
                animation: spin 1s linear infinite;
            }
            
            .loading-message {
                margin-top: 1rem;
                font-weight: bold;
                color: #333;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add the loading element to the container
    container.appendChild(loadingElement);
}

/**
 * Hide loading spinner from a container
 * @param {string} containerId - ID of the container element
 */
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    
    // Remove loading element
    const loadingElement = container.querySelector('.loading-container');
    if (loadingElement) {
        container.removeChild(loadingElement);
    }
}

/**
 * Show error message in a container
 * @param {string} containerId - ID of the container element
 * @param {string} message - Error message
 */
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-container';
    errorElement.innerHTML = `
        <div class="error-icon"><span class="material-icons">error</span></div>
        <div class="error-message">${message}</div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('error-styles')) {
        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error-container {
                padding: 1rem;
                background-color: rgba(244, 67, 54, 0.1);
                border-left: 4px solid #f44336;
                margin-bottom: 1rem;
                border-radius: 4px;
                display: flex;
                align-items: center;
            }
            
            .error-icon {
                margin-right: 0.5rem;
                color: #f44336;
            }
            
            .error-message {
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Clear container and add error element
    container.innerHTML = '';
    container.appendChild(errorElement);
}

/**
 * Create a simple modal dialog
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.content - Modal content
 * @param {Array} options.buttons - Modal buttons
 * @returns {Object} - Modal object
 */
function createModal(options = {}) {
    const {
        title = 'Dialog',
        content = '',
        buttons = [{ text: 'OK', action: 'close', primary: true }]
    } = options;
    
    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.className = 'modal-container';
    modalElement.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-dialog">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-content">${content}</div>
            <div class="modal-footer">
                ${buttons.map(btn => `
                    <button class="modal-button ${btn.primary ? 'primary' : 'secondary'}" 
                            data-action="${btn.action || 'close'}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }
            
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            }
            
            .modal-dialog {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                position: relative;
                z-index: 2001;
                overflow: hidden;
            }
            
            .modal-header {
                padding: 1rem;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-content {
                padding: 1rem;
                overflow-y: auto;
                flex: 1;
            }
            
            .modal-footer {
                padding: 1rem;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .modal-close:hover {
                opacity: 1;
            }
            
            .modal-button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }
            
            .modal-button.primary {
                background-color: #3f51b5;
                color: white;
            }
            
            .modal-button.secondary {
                background-color: #e0e0e0;
                color: #333;
            }
            
            .modal-button:hover {
                opacity: 0.9;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add modal to document
    document.body.appendChild(modalElement);
    
    // Create modal object
    const modal = {
        element: modalElement,
        
        close() {
            modalElement.remove();
        },
        
        setContent(newContent) {
            const contentElement = modalElement.querySelector('.modal-content');
            if (contentElement) {
                contentElement.innerHTML = newContent;
            }
        }
    };
    
    // Setup event listeners
    const closeButton = modalElement.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => modal.close());
    }
    
    const backdrop = modalElement.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => modal.close());
    }
    
    // Setup action buttons
    const actionButtons = modalElement.querySelectorAll('.modal-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            
            if (action === 'close') {
                modal.close();
            } else {
                // Find button config and execute its callback
                const buttonConfig = buttons.find(btn => btn.action === action);
                if (buttonConfig && typeof buttonConfig.callback === 'function') {
                    buttonConfig.callback(modal);
                }
            }
        });
    });
    
    return modal;
}

/**
 * Show a confirm dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback for confirm action
 * @param {Function} onCancel - Callback for cancel action
 * @param {Object} options - Additional options
 * @returns {Object} - Modal object
 */
function showConfirm(message, onConfirm, onCancel, options = {}) {
    const {
        title = 'Confirm',
        confirmText = 'OK',
        cancelText = 'Cancel'
    } = options;
    
    return createModal({
        title,
        content: `<p>${message}</p>`,
        buttons: [
            {
                text: cancelText,
                action: 'cancel',
                callback: modal => {
                    if (typeof onCancel === 'function') {
                        onCancel();
                    }
                    modal.close();
                }
            },
            {
                text: confirmText,
                action: 'confirm',
                primary: true,
                callback: modal => {
                    if (typeof onConfirm === 'function') {
                        onConfirm();
                    }
                    modal.close();
                }
            }
        ]
    });
}

/**
 * Show a prompt dialog
 * @param {string} message - Prompt message
 * @param {Function} onSubmit - Callback for submit action
 * @param {string} defaultValue - Default input value
 * @param {Object} options - Additional options
 * @returns {Object} - Modal object
 */
function showPrompt(message, onSubmit, defaultValue = '', options = {}) {
    const {
        title = 'Prompt',
        submitText = 'Submit',
        cancelText = 'Cancel',
        inputType = 'text',
        placeholder = ''
    } = options;
    
    const inputId = 'modal-prompt-input-' + Date.now();
    
    const modal = createModal({
        title,
        content: `
            <p>${message}</p>
            <div class="modal-input-container">
                <input type="${inputType}" id="${inputId}" 
                       class="modal-input" value="${defaultValue}" 
                       placeholder="${placeholder}">
            </div>
        `,
        buttons: [
            {
                text: cancelText,
                action: 'cancel'
            },
            {
                text: submitText,
                action: 'submit',
                primary: true,
                callback: modal => {
                    const input = document.getElementById(inputId);
                    if (input && typeof onSubmit === 'function') {
                        onSubmit(input.value);
                    }
                    modal.close();
                }
            }
        ]
    });
    
    // Add styles for input
    if (!document.getElementById('modal-input-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-input-styles';
        style.textContent = `
            .modal-input-container {
                margin-top: 1rem;
            }
            
            .modal-input {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 1rem;
            }
            
            .modal-input:focus {
                outline: none;
                border-color: #3f51b5;
                box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Focus input
    setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) {
            input.focus();
            input.select();
            
            // Submit on Enter
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    if (typeof onSubmit === 'function') {
                        onSubmit(input.value);
                    }
                    modal.close();
                }
            });
        }
    }, 100);
    
    return modal;
}

/**
 * Add keyboard shortcuts
 * @param {Object} shortcuts - Keyboard shortcuts
 */
function setupKeyboardShortcuts(shortcuts) {
    document.addEventListener('keydown', (event) => {
        // Skip if input element is focused
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        // Check for shortcut
        for (const [key, callback] of Object.entries(shortcuts)) {
            // Parse key combination (e.g., "Ctrl+S")
            const parts = key.split('+');
            const keyCode = parts.pop().toLowerCase();
            const needCtrl = parts.includes('Ctrl') || parts.includes('ctrl');
            const needShift = parts.includes('Shift') || parts.includes('shift');
            const needAlt = parts.includes('Alt') || parts.includes('alt');
            
            // Check if shortcut matches
            if (event.key.toLowerCase() === keyCode && 
                event.ctrlKey === needCtrl && 
                event.shiftKey === needShift && 
                event.altKey === needAlt) {
                
                event.preventDefault();
                callback(event);
                return;
            }
        }
    });
}

/**
 * Update URL hash without triggering navigation
 * @param {Object} params - Hash parameters
 */
function updateUrlHash(params) {
    if (!params || typeof params !== 'object') return;
    
    const hash = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    
    history.replaceState(null, null, `#${hash}`);
}

/**
 * Parse URL hash parameters
 * @returns {Object} - Hash parameters
 */
function parseUrlHash() {
    const hash = window.location.hash.substring(1);
    if (!hash) return {};
    
    return hash.split('&').reduce((params, part) => {
        const [key, value] = part.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        return params;
    }, {});
}

/**
 * Track event for analytics
 * @param {string} category - Event category
 * @param {string} action - Event action
 * @param {string} label - Event label
 * @param {number} value - Event value
 */
function trackEvent(category, action, label = '', value = 0) {
    // Check if analytics is available
    if (typeof gtag === 'function') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value
        });
    } else if (typeof ga === 'function') {
        ga('send', 'event', category, action, label, value);
    } else {
        console.log('Analytics event:', category, action, label, value);
    }
}

/**
 * Format timestamp in a user-friendly way
 * @param {Date|string|number} timestamp - Timestamp to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(timestamp, includeTime = true) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString(undefined, options);
}