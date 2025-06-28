# Firebase Setup Guide for Clean Cut Lounge Application

## 🔥 Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `cleancutlounge-barbershop` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** sign-in provider
3. Click "Save"

### Step 3: Set up Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location closest to your users
5. Click "Done"

### Step 4: Create Collections

Your Firebase will automatically create these collections when the app runs:

- **users**: User profiles with roles (admin, owner, customer)
- **bookings**: Appointment bookings with status tracking

### Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" > Web app (</>) 
4. Register your app with name: `Clean Cut Lounge Web App`
5. Copy the Firebase configuration object

### Step 6: Update Environment Files

Replace the placeholder values in both files:

**src/environments/environment.ts** (Development):
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
  }
};
```

**src/environments/environment.prod.ts** (Production):
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com", 
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
  }
};
```

### Step 7: Configure Firestore Security Rules

Go to **Firestore Database** > **Rules** and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Users can read/write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read/write all user profiles
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      // Users can read/write their own bookings
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      // Owners and admins can read/write all bookings
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### Step 8: Test the Integration

1. Run `ng serve` to start the development server
2. The app will automatically create an admin user on first launch
3. Try logging in with the admin credentials
4. Test creating bookings and managing users

## 🔐 Default Admin Account

The application will automatically create an admin account:
- **Email**: admin@cleancutlounge.com
- **Password**: admin123

## 🚀 Features Enabled with Firebase

### Authentication
- ✅ Email/Password authentication
- ✅ Role-based access control (admin, owner, customer)
- ✅ Secure user session management

### Database
- ✅ Real-time user management
- ✅ Appointment booking system
- ✅ Business analytics and reporting
- ✅ Data persistence across sessions

### Security
- ✅ Firestore security rules
- ✅ User data isolation
- ✅ Role-based data access

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## 🛠️ Troubleshooting

### Common Issues:

1. **"Firebase not initialized"**: Check environment.ts configuration
2. **"Permission denied"**: Verify Firestore security rules
3. **"Auth domain mismatch"**: Ensure authDomain matches your project
4. **"Network error"**: Check internet connection and Firebase project status

### Support:
If you encounter issues, check the browser console for detailed error messages.