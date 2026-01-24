# CSP Frontend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=http://localhost:5000
```

3. Enable Google Sign-In in Firebase Console:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Google provider
   - Add authorized domains if needed

4. Run the development server:
```bash
npm run dev
```

## Features

- ✅ Google Sign-In/Sign-Up with Firebase
- ✅ Phone number collection on sign-up (no OTP)
- ✅ Protected routes
- ✅ shadcn/ui components
- ✅ Backend API integration

## Flow

1. User clicks "Sign in with Google"
2. Firebase handles Google authentication
3. Backend checks if user exists:
   - If exists → Sign in and redirect to home
   - If new → Show phone number form
4. User enters phone number (sign-up only)
5. Backend creates user account
6. Redirect to home page
