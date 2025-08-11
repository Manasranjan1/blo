# 🩸 Blood Donor MVP

A production-ready, location-based blood donor matching platform built with vanilla HTML, CSS, JavaScript, and Firebase.

## 🌟 Features

- **Phone OTP Authentication** - Secure login using Firebase Phone Auth
- **Location-Based Matching** - Find donors within 25km radius using GPS
- **Real-time Notifications** - Firebase Cloud Messaging for instant updates
- **Smart Request System** - Create urgent/normal blood requests
- **Donor Dashboard** - View and respond to nearby requests
- **Request Tracking** - Monitor status and donor responses
- **Responsive Design** - Mobile-first, modern UI
- **Offline Support** - Firestore offline persistence

## 🚀 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Firebase (Auth, Firestore, Cloud Messaging)
- **Location Services**: Browser Geolocation API + OpenStreetMap
- **Hosting**: Firebase Hosting / Netlify (Free)

## 📁 Project Structure

```
bloodDonor/
├── index.html              # Login/Register page
├── profile.html            # User profile creation/editing
├── create-request.html     # Blood request creation
├── donor-dashboard.html    # View nearby requests
├── requester-dashboard.html # Track your requests
├── styles.css              # Main stylesheet
├── firebaseConfig.js       # Firebase configuration
├── geoFirestore.js         # Location-based queries
├── auth.js                 # Authentication module
├── requests.js             # Request management
├── notifications.js        # Push notifications
└── README.md              # This file
```

## 🔧 Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - **Authentication** → Phone provider
   - **Firestore Database** → Start in test mode
   - **Cloud Messaging** → Get FCM server key

### 2. Firebase Configuration

1. In your Firebase project, go to Project Settings
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app
4. Copy the config object
5. Open `firebaseConfig.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

### 3. Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read all requests
    match /requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.requester_id;
    }
    
    // Users can read/write responses
    match /responses/{responseId} {
      allow read, write: if request.auth != null;
    }
    
    // Users can read/write their own notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.recipient_id;
    }
  }
}
```

### 4. Phone Authentication Setup

1. In Firebase Console → Authentication → Sign-in method
2. Enable Phone provider
3. Add your test phone numbers (for development)
4. Set up reCAPTCHA verification

### 5. Cloud Messaging Setup

1. In Firebase Console → Project Settings → Cloud Messaging
2. Generate a new server key
3. Note down the FCM server key for future use

## 🏃‍♂️ Running Locally

### Option 1: Simple HTTP Server

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

### Option 2: Live Server (VS Code)

1. Install "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Firebase Emulator (Advanced)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init hosting

# Start emulator
firebase serve
```

## 🌐 Deployment

### Option 1: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy
```

### Option 2: Netlify

1. Drag and drop your project folder to [Netlify](https://netlify.com/)
2. Or connect your GitHub repository
3. Set build command: `echo "No build required"`
4. Set publish directory: `.`

### Option 3: GitHub Pages

1. Push code to GitHub repository
2. Go to Settings → Pages
3. Select source branch (main/master)
4. Save

## 📱 Usage Flow

1. **User Registration**
   - Enter phone number
   - Receive OTP via SMS
   - Verify OTP

2. **Profile Creation**
   - Fill personal details (name, Aadhaar, blood type)
   - Allow location access
   - Save profile

3. **Creating Blood Request**
   - Select blood type and urgency
   - Use profile location or detect current location
   - Add optional notes
   - Submit request

4. **Donor Response**
   - Donors see nearby requests in their dashboard
   - Can accept or reject requests
   - Requester gets notified of responses

5. **Request Tracking**
   - View all created requests
   - See donor responses
   - Track request status

## 🔒 Security Features

- Phone number verification via OTP
- Location-based access control
- User authentication required for all operations
- Firestore security rules
- HTTPS enforcement in production

## 📊 Database Schema

### Collections

- **users**: User profiles with location data
- **requests**: Blood requests with location and urgency
- **responses**: Donor responses to requests
- **notifications**: Push notification records

### Sample Documents

```javascript
// users collection
{
  id: "user123",
  name: "John Doe",
  aadhaar_no: "123456789012",
  phone: "+919876543210",
  blood_type: "O+",
  location: { lat: 12.9716, lng: 77.5946 },
  created_at: Timestamp,
  fcm_token: "fcm_token_here"
}

// requests collection
{
  id: "req456",
  requester_id: "user123",
  blood_type: "O+",
  urgency: "Urgent",
  location: { lat: 12.9716, lng: 77.5946 },
  created_at: Timestamp,
  status: "pending"
}
```

## 🚨 Important Notes

1. **Location Permission**: Users must allow location access for the app to work
2. **Phone Verification**: Real phone numbers required for production
3. **Firebase Limits**: Be aware of Firebase free tier limits
4. **HTTPS Required**: Location API requires HTTPS in production

## 🐛 Troubleshooting

### Common Issues

1. **Location not working**
   - Ensure HTTPS (required for geolocation)
   - Check browser permissions
   - Try refreshing the page

2. **OTP not received**
   - Verify phone number format
   - Check Firebase Phone Auth setup
   - Use test phone numbers in development

3. **Firestore errors**
   - Check security rules
   - Verify Firebase config
   - Check browser console for errors

### Debug Mode

Enable debug logging in browser console:

```javascript
// Add this to any page for debugging
localStorage.setItem('debug', 'true');
```

## 🔮 Future Enhancements

- [ ] Real-time chat between donors and requesters
- [ ] Blood donation history tracking
- [ ] Hospital/Blood bank integration
- [ ] Emergency contact system
- [ ] Blood compatibility calculator
- [ ] Multi-language support
- [ ] Advanced filtering and search
- [ ] Push notification improvements

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check Firebase documentation
- Review browser console for errors

## 🙏 Acknowledgments

- Firebase team for the excellent backend services
- OpenStreetMap for free geocoding
- Browser vendors for modern web APIs

---

**Built with ❤️ for saving lives through technology** 