# Health Management Platform with Firebase Integration

A comprehensive, intelligent health management platform that allows users to track medications, appointments, vital signs, and more with real-time database synchronization.

## 🚀 Features

### Authentication & User Management
- **Firebase Authentication** - Secure user signup/login with email/password
- **Persistent User Accounts** - Data synced across devices and browsers
- **Offline Support** - LocalStorage fallback when offline

### Health Data Management
- **Medications** - Track prescriptions, dosages, reminders
- **Appointments** - Schedule and manage medical visits
- **Vital Signs** - Log blood pressure, heart rate, weight, blood sugar
- **Interactive Charts** - Visual trends and analytics with Chart.js

### Modern UI/UX
- **SerenitySpace Design** - Clean, modern interface with smooth animations
- **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- **Real-time Updates** - Live data synchronization across all pages

## 🛠 Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Authentication** with Email/Password provider
4. Enable **Firestore Database** in production mode
5. Get your Firebase config from Project Settings

### 2. Update Firebase Config

Edit `firebase-config.js` and replace the config object:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "your-app-id"
};
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
# Development server
npm run serve

# Or use Python server
python3 -m http.server 8080
```

Visit `http://localhost:8080` to access the application.

## 📱 How It Works

### Database Structure
```
users/{userId}/
├── email: string
├── profile: object
├── medications: array
├── appointments: array
└── vitals: array
```

### Authentication Flow
1. **Signup** - Creates Firebase user + Firestore document
2. **Login** - Authenticates and loads user data from Firestore
3. **Logout** - Signs out and clears local data
4. **Offline Mode** - Falls back to localStorage when Firebase unavailable

### Data Synchronization
- **Real-time Sync** - Changes saved to Firebase immediately
- **Offline Support** - Data cached in localStorage
- **Auto-sync** - Syncs cached data when connection restored
- **Cross-device** - Access your data from any device

## 🔧 Technical Stack

- **Frontend**: Pure HTML, CSS, JavaScript (ES6+)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Chart.js
- **Storage**: Firebase + localStorage fallback
- **Design**: Custom CSS with SerenitySpace theme

## 📊 Features Overview

### Dashboard
- Medication reminders for today
- Upcoming appointments
- Latest vital signs
- Quick vital entry
- Health tips and insights

### Medications
- Add/edit/delete medications
- Set dosages and frequencies
- Mark medications as taken
- Search and filter
- Reminder notifications

### Appointments
- Schedule appointments
- Filter by upcoming/past/all
- Doctor and specialty tracking
- Appointment statistics
- Edit/cancel appointments

### Vital Signs
- Log blood pressure, heart rate, weight, blood sugar
- Interactive trend charts
- Recent readings table
- Health status indicators
- Export data functionality

### Profile & Settings
- Personal information management
- Health profile details
- Account settings
- Data export
- Password management

## 🔒 Security

- Firebase Authentication handles secure login
- Firestore security rules protect user data
- Client-side validation for all forms
- Secure password requirements
- Session management with Firebase Auth

## 🌐 Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 📝 Development

### Adding New Features
1. Update `AppState` in `app.js` for new data types
2. Add Firebase sync methods in `firebase-config.js`
3. Create UI components following existing patterns
4. Test offline functionality

### Customization
- Colors: Edit CSS custom properties in `styles.css`
- Firebase rules: Update Firestore security rules
- Features: Modify JavaScript modules as needed

## 🚀 Deployment

### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Static Hosting
Upload all files to any static hosting service (Netlify, Vercel, etc.)

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

**Note**: Remember to update your Firebase configuration before deploying to production!
