// Authentication Guard System
// Prevents access to protected pages without login

class AuthGuard {
    constructor() {
        this.protectedPages = [
            'dashboard.html',
            'medications.html', 
            'appointments.html',
            'vitals.html',
            'profile.html',
            'help.html'
        ];
        
        this.publicPages = [
            'login.html',
            'signup.html',
            'index.html'
        ];
        
        this.init();
    }

    init() {
        // Check authentication on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthOnPageLoad();
        });

        // Listen for auth state changes
        if (window.healthDB && window.healthDB.auth) {
            window.healthDB.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename;
    }

    isProtectedPage(page = null) {
        const currentPage = page || this.getCurrentPage();
        return this.protectedPages.includes(currentPage);
    }

    isPublicPage(page = null) {
        const currentPage = page || this.getCurrentPage();
        return this.publicPages.includes(currentPage) || currentPage === '';
    }

    isAuthenticated() {
        // Check Firebase auth
        if (window.healthDB && window.healthDB.currentUser) {
            return true;
        }

        // Fallback to localStorage (for offline mode)
        const userLoggedIn = localStorage.getItem('userLoggedIn');
        const userEmail = localStorage.getItem('userEmail');
        
        return userLoggedIn === 'true' && userEmail;
    }

    checkAuthOnPageLoad() {
        const currentPage = this.getCurrentPage();
        const isAuth = this.isAuthenticated();
        
        console.log('Auth guard check - page:', currentPage, 'authenticated:', isAuth);
        
        // If on a protected page and not authenticated, redirect to login
        if (this.isProtectedPage(currentPage) && !isAuth) {
            console.log('Redirecting to login - protected page without auth');
            this.redirectToLogin();
            return;
        }

        // If on login/signup page and already authenticated, redirect to dashboard
        if ((currentPage === 'login.html' || currentPage === 'signup.html') && isAuth) {
            console.log('Redirecting to dashboard - already authenticated');
            this.redirectToDashboard();
            return;
        }

        // If on index.html, redirect based on auth status
        if (currentPage === 'index.html' || currentPage === '') {
            if (isAuth) {
                console.log('Redirecting to dashboard from index');
                this.redirectToDashboard();
            } else {
                console.log('Redirecting to login from index');
                this.redirectToLogin();
            }
            return;
        }
        
        console.log('No redirect needed - staying on', currentPage);
    }

    handleAuthStateChange(user) {
        const currentPage = this.getCurrentPage();
        
        if (user) {
            // User is signed in
            if (currentPage === 'login.html' || currentPage === 'signup.html') {
                this.redirectToDashboard();
            }
        } else {
            // User is signed out
            if (this.isProtectedPage(currentPage)) {
                this.redirectToLogin();
            }
        }
    }

    redirectToLogin() {
        if (this.getCurrentPage() !== 'login.html') {
            window.location.href = 'login.html';
        }
    }

    redirectToDashboard() {
        if (this.getCurrentPage() !== 'dashboard.html') {
            window.location.href = 'dashboard.html';
        }
    }

    redirectToSignup() {
        if (this.getCurrentPage() !== 'signup.html') {
            window.location.href = 'signup.html';
        }
    }

    // Method to manually check auth (for use in other scripts)
    requireAuth() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    // Method to logout and redirect
    logout() {
        // Clear Firebase auth
        if (window.healthDB && window.healthDB.signOut) {
            window.healthDB.signOut();
        }

        // Clear localStorage
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userProfile');

        // Redirect to login
        this.redirectToLogin();
    }
}

// Initialize auth guard
const authGuard = new AuthGuard();

// Make it globally available
window.AuthGuard = authGuard;

// Export for module usage (commented out for browser compatibility)
// export default authGuard;
