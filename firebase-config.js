// Firebase Configuration and Database Integration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase config - Your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyCoOwvcbzXCfznjfegK7lzRn-XyzYovBkM",
    authDomain: "serenityspace-83b35.firebaseapp.com",
    projectId: "serenityspace-83b35",
    storageBucket: "serenityspace-83b35.firebasestorage.app",
    messagingSenderId: "202263016311",
    appId: "1:202263016311:web:6b0acc7bef7673f7fce772"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Database service for Health Management Platform
class HealthDatabase {
    constructor() {
        this.currentUser = null;
        this.setupAuthListener();
    }

    // Setup authentication state listener
    setupAuthListener() {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            if (user) {
                console.log('User signed in:', user.email);
                await this.loadUserData();
                // Trigger UI updates
                window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
            } else {
                console.log('User signed out');
                this.currentUser = null;
                // Clear app state
                if (window.AppState) {
                    AppState.user = null;
                    AppState.medications = [];
                    AppState.appointments = [];
                    AppState.vitals = [];
                }
                window.dispatchEvent(new CustomEvent('userSignedOut'));
            }
        });
    }

    // User Authentication Methods
    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create user profile document
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                profile: userData,
                createdAt: new Date().toISOString(),
                medications: [],
                appointments: [],
                vitals: []
            });

            return { success: true, user };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Signin error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Signout error:', error);
            return { success: false, error: error.message };
        }
    }

    // Data Management Methods
    async loadUserData() {
        if (!this.currentUser) return null;

        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Update AppState with loaded data
                if (window.AppState) {
                    AppState.user = {
                        email: userData.email,
                        profile: userData.profile || {}
                    };
                    AppState.medications = userData.medications || [];
                    AppState.appointments = userData.appointments || [];
                    AppState.vitals = userData.vitals || [];
                }

                return userData;
            } else {
                // Document doesn't exist, create it with initial data
                console.log('User document not found, creating initial document');
                await this.initializeUserDocument();
                
                // Return empty data structure
                const initialData = {
                    email: this.currentUser.email,
                    profile: {},
                    medications: [],
                    appointments: [],
                    vitals: []
                };
                
                // Update AppState with initial data
                if (window.AppState) {
                    AppState.user = {
                        email: initialData.email,
                        profile: initialData.profile
                    };
                    AppState.medications = initialData.medications;
                    AppState.appointments = initialData.appointments;
                    AppState.vitals = initialData.vitals;
                }
                
                return initialData;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
        return null;
    }

    async initializeUserDocument() {
        if (!this.currentUser) return false;

        try {
            const initialData = {
                email: this.currentUser.email,
                profile: {
                    name: this.currentUser.email.split('@')[0],
                    createdAt: new Date().toISOString()
                },
                medications: [],
                appointments: [],
                vitals: []
            };

            await setDoc(doc(db, 'users', this.currentUser.uid), initialData);
            console.log('User document initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing user document:', error);
            return false;
        }
    }

    async saveUserProfile(profileData) {
        if (!this.currentUser) return false;

        try {
            await setDoc(doc(db, 'users', this.currentUser.uid), {
                profile: profileData
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            return false;
        }
    }

    async saveMedications(medications) {
        if (!this.currentUser) return false;

        try {
            await setDoc(doc(db, 'users', this.currentUser.uid), {
                medications: medications
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error saving medications:', error);
            return false;
        }
    }

    async saveAppointments(appointments) {
        if (!this.currentUser) return false;

        try {
            await setDoc(doc(db, 'users', this.currentUser.uid), {
                appointments: appointments
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error saving appointments:', error);
            return false;
        }
    }

    async saveVitals(vitals) {
        if (!this.currentUser) return false;

        try {
            await setDoc(doc(db, 'users', this.currentUser.uid), {
                vitals: vitals
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error saving vitals:', error);
            return false;
        }
    }

    // Real-time data sync methods
    async addMedication(medicationData) {
        if (!window.AppState) return false;
        
        const medications = [...AppState.medications, medicationData];
        AppState.medications = medications;
        return await this.saveMedications(medications);
    }

    async addAppointment(appointmentData) {
        if (!window.AppState) return false;
        
        const appointments = [...AppState.appointments, appointmentData];
        AppState.appointments = appointments;
        return await this.saveAppointments(appointments);
    }

    async addVital(vitalData) {
        if (!window.AppState) return false;
        
        const vitals = [vitalData, ...AppState.vitals];
        AppState.vitals = vitals;
        return await this.saveVitals(vitals);
    }
}

// Initialize and export the database instance
const healthDB = new HealthDatabase();
window.healthDB = healthDB;

// Export for module usage
export default { healthDB };

// Export for use in other files
window.healthDB = healthDB;
window.firebaseAuth = auth;
window.firebaseDB = db;

export { healthDB, auth, db };
