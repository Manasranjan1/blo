// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcfaDr71gPdVXyC8iCLwmc0yRYpSM9_hU",
  authDomain: "blood-4ea13.firebaseapp.com",
  projectId: "blood-4ea13",
  storageBucket: "blood-4ea13.firebasestorage.app",
  messagingSenderId: "904499304550",
  appId: "1:904499304550:web:cd77e4fb1577a2f8ec75a7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const messaging = firebase.messaging();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser does not support persistence.');
    }
  });

// Export for use in other files
window.auth = auth;
window.db = db;
window.messaging = messaging;

// Debug: Log Firebase initialization
console.log('Firebase initialized successfully');
console.log('Auth object:', auth);
console.log('Config:', firebase.app().options);