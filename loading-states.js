// Loading States and Error Handling for Health Management Platform

class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.createGlobalLoader();
    }

    // Create global loading overlay
    createGlobalLoader() {
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">Loading...</div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    // Show loading state
    show(message = 'Loading...', target = null) {
        const loaderId = Date.now().toString();
        this.activeLoaders.add(loaderId);

        if (target) {
            this.showLocalLoader(target, message, loaderId);
        } else {
            this.showGlobalLoader(message);
        }

        return loaderId;
    }

    // Hide loading state
    hide(loaderId = null) {
        if (loaderId) {
            this.activeLoaders.delete(loaderId);
            const loader = document.querySelector(`[data-loader-id="${loaderId}"]`);
            if (loader) {
                loader.remove();
            }
        } else {
            this.hideGlobalLoader();
            this.activeLoaders.clear();
        }
    }

    // Show global loader
    showGlobalLoader(message) {
        const loader = document.getElementById('globalLoader');
        const textEl = loader.querySelector('.loading-text');
        textEl.textContent = message;
        loader.classList.add('active');
    }

    // Hide global loader
    hideGlobalLoader() {
        const loader = document.getElementById('globalLoader');
        loader.classList.remove('active');
    }

    // Show local loader on specific element
    showLocalLoader(target, message, loaderId) {
        const loader = document.createElement('div');
        loader.className = 'local-loader';
        loader.setAttribute('data-loader-id', loaderId);
        loader.innerHTML = `
            <div class="local-spinner">
                <div class="spinner-small"></div>
                <span>${message}</span>
            </div>
        `;

        if (typeof target === 'string') {
            target = document.querySelector(target);
        }

        if (target) {
            target.style.position = 'relative';
            target.appendChild(loader);
        }
    }

    // Show button loading state
    showButtonLoader(button, message = 'Loading...') {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }

        if (button) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = `
                <span class="btn-spinner"></span>
                ${message}
            `;
            button.classList.add('loading');
        }
    }

    // Hide button loading state
    hideButtonLoader(button) {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }

        if (button && button.dataset.originalText) {
            button.disabled = false;
            button.textContent = button.dataset.originalText;
            button.classList.remove('loading');
            delete button.dataset.originalText;
        }
    }
}

// Error Handler Class
class ErrorHandler {
    constructor() {
        this.setupGlobalErrorHandling();
    }

    // Setup global error handling
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.show('An unexpected error occurred. Please try again.', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.show('Network error. Please check your connection.', 'error');
        });
    }

    // Show error message
    show(message, type = 'error', duration = 5000) {
        const errorEl = document.createElement('div');
        errorEl.className = `alert alert-${type} error-toast`;
        errorEl.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${this.getIcon(type)}</span>
                <span class="alert-message">${message}</span>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(errorEl);

        // Auto remove after duration
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.remove();
            }
        }, duration);

        return errorEl;
    }

    // Get icon for alert type
    getIcon(type) {
        const icons = {
            error: '⚠️',
            success: '✅',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Handle Firebase errors
    handleFirebaseError(error) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'permission-denied': 'You do not have permission to perform this action.',
            'unavailable': 'Service temporarily unavailable. Please try again later.'
        };

        const message = errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
        this.show(message, 'error');
        return message;
    }
}

// Initialize global instances
const loadingManager = new LoadingManager();
const errorHandler = new ErrorHandler();

// Export for global use
window.LoadingManager = loadingManager;
window.ErrorHandler = errorHandler;

// Utility functions for easy access
window.showLoader = (message, target) => loadingManager.show(message, target);
window.hideLoader = (id) => loadingManager.hide(id);
window.showError = (message, type) => errorHandler.show(message, type);
window.handleFirebaseError = (error) => errorHandler.handleFirebaseError(error);
