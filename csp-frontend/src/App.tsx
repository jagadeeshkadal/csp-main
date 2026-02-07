import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { PhoneNumberForm } from '@/components/auth/PhoneNumberForm';
import { CorporateLayout } from '@/components/auth/CorporateLayout';
import { HomePage } from '@/pages/HomePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { getCurrentUser as getFirebaseUser, getIdToken } from '@/lib/firebase';
import { getAuthToken } from '@/lib/storage';
import { authAPI } from '@/lib/api';

function AuthPageContent() {
  const [step, setStep] = useState<'signin' | 'phone'>('signin');
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent multiple calls
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      const token = getAuthToken();
      console.log('[AuthPage] checkAuth called, token exists:', !!token);

      // If token exists, try to verify it with backend
      if (token) {
        try {
          console.log('[AuthPage] Verifying token with backend...');
          await authAPI.getCurrentUser();
          console.log('[AuthPage] Token verified, redirecting to home');
          // If successful, user is authenticated, redirect to home
          // This only happens when user lands on auth page with valid token
          navigate('/home', { replace: true });
          return;
        } catch (error: any) {
          // Token is invalid, clear it and show login
          console.log('[AuthPage] Token invalid:', error.response?.data?.message || error.message);
          console.log('[AuthPage] Clearing token and showing login');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
        }
      }

      // Don't auto-redirect based on Firebase user alone - they need to complete signup
      // Only redirect if they have a valid backend token
      console.log('[AuthPage] No valid token, showing login page');
      setCheckingAuth(false);
    };

    checkAuth();
  }, []); // Empty dependency array - only run once on mount

  const handleSignUp = (token: string) => {
    setFirebaseToken(token);
    setStep('phone');
  };

  const handleSuccess = () => {
    navigate('/home');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <CorporateLayout step={step}>
      {step === 'signin' ? (
        <GoogleSignIn onSuccess={handleSuccess} onSignUp={handleSignUp} />
      ) : firebaseToken ? (
        <PhoneNumberForm token={firebaseToken} onSuccess={handleSuccess} />
      ) : null}
    </CorporateLayout>
  );
}

function AuthPage() {
  return <AuthPageContent />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent multiple calls
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      const storedToken = getAuthToken();
      console.log('[ProtectedRoute] Checking auth, token exists:', !!storedToken);

      // If token exists in localStorage, try to fetch user data from backend
      if (storedToken) {
        try {
          console.log('[ProtectedRoute] Token found, calling getCurrentUser');
          await authAPI.getCurrentUser();
          console.log('[ProtectedRoute] getCurrentUser succeeded, user is authenticated');
          // If successful, user is authenticated
          setIsAuthenticated(true);
          return;
        } catch (error: any) {
          console.error('[ProtectedRoute] getCurrentUser failed:', error);
          console.error('[ProtectedRoute] Error details:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
          });

          // Token is invalid, clear it
          console.error('[ProtectedRoute] Token invalid, clearing and denying access');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          return;
        }
      }

      // No token - user is not authenticated
      console.log('[ProtectedRoute] No token found, user not authenticated');
      setIsAuthenticated(false);
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
