import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD5l0vtPTCb1OiQ7M-w7LWclMSdRfQEwss",
  authDomain: "csp-dev-36bf8.firebaseapp.com",
  projectId: "csp-dev-36bf8",
  storageBucket: "csp-dev-36bf8.firebasestorage.app",
  messagingSenderId: "336003475074",
  appId: "1:336003475074:web:dfe07921c7d2b45b68369b",
  measurementId: "G-0T1763F9G0"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Get ID token
export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
};

// Sign out
export const signOut = async (): Promise<void> => {
  await auth.signOut();
  // Clear all auth-related data from localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userPhoneNumber');
  localStorage.removeItem('userPhoneExtension');
};

export default app;
