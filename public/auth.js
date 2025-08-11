// Authentication module for Firebase Phone OTP
class Auth {
  constructor() {
    this.auth = window.auth;
    this.db = window.db;
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
      const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
          console.log('reCAPTCHA solved');
        }
      }, window.auth);

      const confirmationResult = await this.auth.signInWithPhoneNumber(phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      
      // Hide phone input, show OTP input
      document.getElementById('phone-section').style.display = 'none';
      document.getElementById('otp-section').style.display = 'block';
      
      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
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