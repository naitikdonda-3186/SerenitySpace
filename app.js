// SerenitySpace - Main JavaScript File

// Global state management with Firebase integration
const AppState = {
    user: null,
    medications: [],
    appointments: [],
    vitals: [],
    isOnline: navigator.onLine,
    
    // Initialize app state with database support
    async init() {
        // Check if user is logged in first
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        
        if (isLoggedIn) {
            // Load from localStorage first for immediate UI
            this.loadFromLocalStorage();
            
            // Then sync with Firebase if available and user is authenticated
            if (window.healthDB) {
                // Wait for Firebase auth to initialize
                let attempts = 0;
                const maxAttempts = 10;
                
                const waitForAuth = async () => {
                    if (window.healthDB.currentUser || attempts >= maxAttempts) {
                        if (window.healthDB.currentUser) {
                            await this.loadFromDatabase();
                        }
                        return;
                    }
                    attempts++;
                    setTimeout(waitForAuth, 200);
                };
                
                setTimeout(waitForAuth, 100);
            }
        }
        
        // Setup network listeners for offline/online sync
        this.setupNetworkListeners();
    },
    
    // Load data from Firebase
    async loadFromDatabase() {
        try {
            if (window.healthDB && window.healthDB.currentUser) {
                console.log('Loading data from Firebase for user:', window.healthDB.currentUser.uid);
                const userData = await window.healthDB.loadUserData();
                if (userData) {
                    console.log('Firebase data loaded:', userData);
                    this.user = {
                        email: userData.email,
                        profile: userData.profile || {}
                    };
                    this.medications = userData.medications || [];
                    this.appointments = userData.appointments || [];
                    this.vitals = userData.vitals || [];
                    
                    // Update localStorage with Firebase data
                    localStorage.setItem('userName', userData.profile?.name || userData.email?.split('@')[0] || 'User');
                    localStorage.setItem('medications', JSON.stringify(this.medications));
                    localStorage.setItem('appointments', JSON.stringify(this.appointments));
                    localStorage.setItem('vitals', JSON.stringify(this.vitals));
                    localStorage.setItem('userProfile', JSON.stringify(userData.profile || {}));
                    
                    console.log('Data synced to localStorage - medications:', this.medications.length, 'appointments:', this.appointments.length, 'vitals:', this.vitals.length);
                    
                    // Trigger UI updates
                    this.notifyDataUpdated();
                } else {
                    console.log('No Firebase data found for user');
                }
            }
        } catch (error) {
            console.error('Failed to load from database:', error);
        }
    },
    
    // Fallback to localStorage
    loadFromLocalStorage() {
        this.loadUserData();
        this.loadMedications();
        this.loadAppointments();
        this.loadVitals();
    },

    // Notify UI components that data has been updated
    notifyDataUpdated() {
        // Dispatch custom events for different data types
        window.dispatchEvent(new CustomEvent('medicationsUpdated', { detail: this.medications }));
        window.dispatchEvent(new CustomEvent('appointmentsUpdated', { detail: this.appointments }));
        window.dispatchEvent(new CustomEvent('vitalsUpdated', { detail: this.vitals }));
        window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: this.user }));
        
        // Update dashboard if on dashboard page
        if (window.location.pathname.includes('dashboard.html') && typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }
    },
    
    // Load user data from localStorage
    loadUserData() {
        const isLoggedIn = localStorage.getItem('userLoggedIn');
        if (isLoggedIn === 'true') {
            this.user = {
                email: localStorage.getItem('userEmail'),
                name: localStorage.getItem('userName'),
                profile: JSON.parse(localStorage.getItem('userProfile') || '{}')
            };
        }
    },
    
    // Load medications from localStorage
    loadMedications() {
        const stored = localStorage.getItem('medications');
        this.medications = stored ? JSON.parse(stored) : [];
    },
    
    // Load appointments from localStorage
    loadAppointments() {
        const stored = localStorage.getItem('appointments');
        this.appointments = stored ? JSON.parse(stored) : [];
    },
    
    // Load vitals from localStorage
    loadVitals() {
        const stored = localStorage.getItem('vitals');
        this.vitals = stored ? JSON.parse(stored) : [];
    },
    
    // Enhanced save methods with Firebase sync
    async saveMedications() {
        // Save to Firebase if authenticated and online
        if (this.isOnline && window.healthDB && window.healthDB.currentUser) {
            await window.healthDB.saveMedications(this.medications);
        }
        // Always save to localStorage as backup
        localStorage.setItem('medications', JSON.stringify(this.medications));
    },
    
    async saveAppointments() {
        if (this.isOnline && window.healthDB && window.healthDB.currentUser) {
            await window.healthDB.saveAppointments(this.appointments);
        }
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
    },
    
    async saveVitals() {
        if (this.isOnline && window.healthDB && window.healthDB.currentUser) {
            await window.healthDB.saveVitals(this.vitals);
        }
        localStorage.setItem('vitals', JSON.stringify(this.vitals));
        
        // Trigger dashboard update if on dashboard page
        if (window.location.pathname.includes('dashboard.html') && typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }
    },
    
    // Enhanced add methods with Firebase sync
    async addVital(vitalData) {
        this.vitals.unshift(vitalData);
        await this.saveVitals();
        
        // Broadcast update to all pages
        window.dispatchEvent(new CustomEvent('vitalsUpdated', { detail: vitalData }));
    },
    
    async addMedication(medicationData) {
        this.medications.push(medicationData);
        await this.saveMedications();
        
        window.dispatchEvent(new CustomEvent('medicationsUpdated', { detail: medicationData }));
    },
    
    async addAppointment(appointmentData) {
        this.appointments.push(appointmentData);
        await this.saveAppointments();
        
        window.dispatchEvent(new CustomEvent('appointmentsUpdated', { detail: appointmentData }));
    },
    
    // Network status management
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncWithDatabase();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    },

    // Firebase-only login - no localStorage fallback
    async loginUser(email, password) {
        try {
            // Only allow Firebase authentication - no localStorage fallback for login
            if (!this.isOnline || !window.healthDB) {
                return { success: false, error: 'Internet connection required for login' };
            }
            
            // Try Firebase authentication only
            const result = await window.healthDB.signIn(email, password);
            if (result.success) {
                // Set localStorage flags for auth guard first
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                localStorage.setItem('currentUserId', result.user.uid);
                
                // Load user data from Firebase immediately - no delay
                await this.loadFromDatabase();
                
                return { success: true, user: result.user };
            } else {
                return { success: false, error: result.error || 'Invalid email or password' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Sync localStorage data with database when coming back online
    async syncWithDatabase() {
        if (!window.healthDB || !window.healthDB.currentUser) return;
        
        try {
            // Load current data from localStorage to ensure we have latest
            this.loadFromLocalStorage();
            
            await Promise.all([
                window.healthDB.saveMedications(this.medications),
                window.healthDB.saveAppointments(this.appointments),
                window.healthDB.saveVitals(this.vitals)
            ]);
            
            console.log('Data synced with database');
        } catch (error) {
            console.error('Failed to sync with database:', error);
        }
    },

    // Enhanced save methods that sync with Firebase immediately
    async saveMedications() {
        console.log('Saving medications:', this.medications.length, 'items');
        localStorage.setItem('medications', JSON.stringify(this.medications));
        
        if (this.isOnline && window.healthDB && window.healthDB.currentUser) {
            try {
                await window.healthDB.saveMedications(this.medications);
                console.log('Medications saved to Firebase successfully');
            } catch (error) {
                console.error('Failed to save medications to Firebase:', error);
            }
        }
    },

    async saveAppointments() {
        console.log('Saving appointments:', this.appointments.length, 'items');
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
        
        if (this.isOnline && window.healthDB && window.healthDB.currentUser) {
            try {
                await window.healthDB.saveAppointments(this.appointments);
                console.log('Appointments saved to Firebase successfully');
            } catch (error) {
                console.error('Failed to save appointments to Firebase:', error);
            }
        }
    },

    async saveVitals() {
        console.log('Saving vitals:', this.vitals.length, 'items');
        localStorage.setItem('vitals', JSON.stringify(this.vitals));
        
        if (this.isOnline && window.healthDB && window.healthDB.currentUser) {
            try {
                await window.healthDB.saveVitals(this.vitals);
                console.log('Vitals saved to Firebase successfully');
            } catch (error) {
                console.error('Failed to save vitals to Firebase:', error);
            }
        }
        
        if (window.location.pathname.includes('dashboard.html') && typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }
    }
};

// Navigation management
const Navigation = {
    init() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.checkAuthStatus();
    },
    
    setupNavigation() {
        // Add active class to current page
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        const navLinks = document.querySelectorAll('.nav-link, .sidebar-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'dashboard.html')) {
                link.classList.add('active');
            }
        });
    },
    
    setupMobileMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (navToggle && sidebar) {
            navToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
            
            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !navToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    },
    
    checkAuthStatus() {
        const isLoggedIn = localStorage.getItem('userLoggedIn');
        const currentPage = window.location.pathname.split('/').pop();
        const authPages = ['login.html', 'signup.html'];
        const protectedPages = ['dashboard.html', 'medications.html', 'appointments.html', 'vitals.html', 'profile.html', 'settings.html'];
        
        if (!isLoggedIn && protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        } else if (isLoggedIn && authPages.includes(currentPage)) {
            window.location.href = 'dashboard.html';
        }
    },
    
    async logout() {
        // Save current data to Firebase before logout
        if (window.healthDB && window.healthDB.currentUser) {
            try {
                await this.syncWithDatabase();
                await window.healthDB.signOut();
            } catch (error) {
                console.error('Error during logout sync:', error);
            }
        }
        
        // Clear all user data
        this.clearUserData();
        window.location.href = 'login.html';
    },
    
    // Clear all user-specific data
    clearUserData() {
        const keysToRemove = [
            'userLoggedIn',
            'userEmail', 
            'userName',
            'userProfile',
            'medications',
            'appointments',
            'vitals',
            'primaryDoctor',
            'currentUserId'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    },

    // Enhanced login with Firebase support - only registered users can login
    async loginUser(email, password) {
        // Delegate to AppState.loginUser for proper Firebase authentication
        return await AppState.loginUser(email, password);
    },
    
    // Signup method - only way to create new accounts
    async signupUser(email, password, userData) {
        try {
            if (!this.isOnline || !window.healthDB) {
                return { success: false, error: 'Internet connection required for signup' };
            }
            
            // Use Firebase to create account
            const result = await window.healthDB.signUp(email, password, userData);
            if (result.success) {
                this.currentUser = result.user.uid;
                await this.loadUserData();
                return { success: true, user: result.user };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Generate unique user ID
    generateUserId(email) {
        return btoa(email).replace(/[^a-zA-Z0-9]/g, '') + '_' + Date.now();
    }
};

// Utility functions
const Utils = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    formatTime(timeString) {
        if (timeString.includes(':')) {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        }
        return timeString;
    },
    
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },
    
    getTimeUntil(dateString) {
        const now = new Date();
        const target = new Date(dateString);
        const diff = target - now;
        
        if (diff < 0) return 'Overdue';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours === 0) {
            return `${minutes} minutes`;
        } else if (hours < 24) {
            return `${hours} hours`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days} days`;
        }
    },
    
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '1000';
        notification.style.minWidth = '300px';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Form validation utilities
const Validation = {
    email(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    phone(phone) {
        const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        return regex.test(phone);
    },
    
    required(value) {
        return value && value.toString().trim().length > 0;
    },
    
    minLength(value, min) {
        return value && value.toString().length >= min;
    },
    
    maxLength(value, max) {
        return value && value.toString().length <= max;
    },
    
    number(value) {
        return !isNaN(value) && isFinite(value);
    },
    
    positiveNumber(value) {
        return this.number(value) && parseFloat(value) > 0;
    }
};

// Modal management
const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    closeAll() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
};

// Chart utilities (for vital metrics)
const Charts = {
    createLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        // Simple line chart implementation
        const chartData = {
            labels: data.labels,
            datasets: [{
                label: options.label || 'Data',
                data: data.values,
                borderColor: options.borderColor || '#4f46e5',
                backgroundColor: options.backgroundColor || 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        };
        
        // This would integrate with Chart.js in a real implementation
        // For now, we'll create a simple visual representation
        this.drawSimpleChart(ctx, chartData, canvas.width, canvas.height);
    },
    
    drawSimpleChart(ctx, data, width, height) {
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw data line
        if (data.datasets[0].data.length > 0) {
            const values = data.datasets[0].data;
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const valueRange = maxValue - minValue || 1;
            
            ctx.strokeStyle = data.datasets[0].borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            values.forEach((value, index) => {
                const x = padding + (index / (values.length - 1)) * chartWidth;
                const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = data.datasets[0].borderColor;
            values.forEach((value, index) => {
                const x = padding + (index / (values.length - 1)) * chartWidth;
                const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    AppState.init();
    Navigation.init();
    
    // Setup global event listeners
    document.addEventListener('click', function(e) {
        // Close dropdowns when clicking outside
        if (!e.target.closest('.dropdown')) {
            const dropdowns = document.querySelectorAll('.dropdown-menu');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
        
        // Handle modal close buttons
        if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
        
        // Handle logout
        if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
            e.preventDefault();
            Navigation.logout();
        }
    });
    
    // Handle modal overlay clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Export for use in other files
window.AppState = AppState;
window.Navigation = Navigation;
window.Utils = Utils;
window.Validation = Validation;
window.Modal = Modal;
window.Charts = Charts;
