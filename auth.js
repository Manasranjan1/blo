// Authentication module for Firebase Phone OTP
class Auth {
  constructor() {
    this.auth = window.auth;
    this.db = window.db;
    this.firebaseApp = window.firebaseApp;
    this.currentUser = null;
    this.setupAuthStateListener();
  }

  // Setup authentication state listener
  setupAuthStateListener() {
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        console.log('User signed in:', user.phoneNumber);
        this.checkUserProfile(user.uid);
      } else {
        console.log('User signed out');
        this.redirectToLogin();
      }
    });
  }

  // Check if user profile exists
  async checkUserProfile(userId) {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      if (doc.exists) {
        console.log('User profile exists');
        // User has profile, redirect to appropriate dashboard
        this.redirectBasedOnRole();
      } else {
        console.log('User profile does not exist');
        // User needs to create profile
        window.location.href = 'profile.html';
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  }

  // Redirect based on user role (for now, just check if they have requests)
  async redirectBasedOnRole() {
    try {
      const requestsSnapshot = await this.db.collection('requests')
        .where('requester_id', '==', this.currentUser.uid)
        .limit(1)
        .get();
      
      if (!requestsSnapshot.empty) {
        // User has made requests, show requester dashboard
        window.location.href = 'requester-dashboard.html';
      } else {
        // User is a potential donor, show donor dashboard
        window.location.href = 'donor-dashboard.html';
      }
    } catch (error) {
      console.error('Error determining user role:', error);
      // Default to donor dashboard
      window.location.href = 'donor-dashboard.html';
    }
  }

  // Redirect to login page
  redirectToLogin() {
    if (window.location.pathname !== '/index.html' && 
        window.location.pathname !== '/' && 
        !window.location.pathname.includes('index.html')) {
      window.location.href = 'index.html';
    }
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber) {
    try {
      console.log('Starting OTP send process for:', phoneNumber);
      console.log('Firebase App available:', !!this.firebaseApp);
      console.log('Auth object available:', !!this.auth);
      
      // Clear any existing reCAPTCHA
      if (window.recaptchaVerifier) {
        console.log('Clearing existing reCAPTCHA verifier');
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      // Create new reCAPTCHA verifier - pass the Firebase app instance directly
      console.log('Creating new reCAPTCHA verifier');
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });

      // Render reCAPTCHA
      console.log('Rendering reCAPTCHA');
      await window.recaptchaVerifier.render();
      console.log('reCAPTCHA rendered successfully');
      
      console.log('Sending OTP to phone number');
      const confirmationResult = await this.auth.signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      console.log('OTP sent successfully');
      
      // Hide phone input, show OTP input
      document.getElementById('phone-section').style.display = 'none';
      document.getElementById('otp-section').style.display = 'block';
      
      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Clear reCAPTCHA on error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clearError) {
          console.error('Error clearing reCAPTCHA:', clearError);
        }
        window.recaptchaVerifier = null;
      }
      
      // Provide more specific error messages
      let userMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        userMessage = 'Invalid phone number format. Please check your phone number.';
      } else if (error.code === 'auth/too-many-requests') {
        userMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        userMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/invalid-api-key') {
        userMessage = 'Authentication service error. Please contact support.';
      }
      
      error.userMessage = userMessage;
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(otp) {
    try {
      if (window.confirmationResult) {
        await window.confirmationResult.confirm(otp);
        console.log('OTP verified successfully');
        return true;
      } else {
        throw new Error('No confirmation result available');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  // Sign out user
  async signOut() {
    try {
      await this.auth.signOut();
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }
}

// Initialize authentication
window.authModule = new Auth(); 