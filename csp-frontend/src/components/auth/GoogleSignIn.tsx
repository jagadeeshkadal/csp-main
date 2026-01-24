import { useState } from 'react';
import { signInWithGoogle, getIdToken } from '@/lib/firebase';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleSignInProps {
  onSuccess: () => void;
  onSignUp: (token: string) => void;
}

export function GoogleSignIn({ onSuccess, onSignUp }: GoogleSignInProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Sign in with Google
      const user = await signInWithGoogle();
      const token = await getIdToken();

      if (!token) {
        throw new Error('Failed to get ID token');
      }

      // Try to sign in to backend
      try {
        const response = await authAPI.signIn({ token });
        // User exists, sign in successful
        onSuccess();
      } catch (err: any) {
        // User doesn't exist, need to sign up
        if (err.response?.status === 401 || err.response?.status === 500) {
          // User not found, proceed to sign up
          onSignUp(token);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      console.error('Google sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>Sign in with your Google account</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full"
          variant="default"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </Button>
        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
