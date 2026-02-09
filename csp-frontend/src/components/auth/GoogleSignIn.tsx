import { useState } from 'react';
import { signInWithGoogle, getIdToken } from '@/lib/firebase';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface GoogleSignInProps {
  onSuccess: () => void;
  onSignUp: (token: string, avatar?: string | null) => void;
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
        // ONLY redirect if we are sure it's a "User Not Found" scenario (usually 404, or 401 if strict)
        // A 500 is a SERVER CRASH (DB error), do NOT redirect to signup.
        if (err.response?.status === 404 || (err.response?.status === 401 && err.response?.data?.message !== "Unauthorized")) {
          // User not found, proceed to sign up
          onSignUp(token, user.photoURL);
        } else {
          // Is it a 500 error?
          if (err.response?.status === 500) {
            throw new Error(`Server Error (Database Connection Failed). Please check Vercel Logs.`);
          }
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
    <div className="w-full bg-transparent p-6 flex items-center justify-end h-full">
      <div className="w-full h-full bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/30 rounded-3xl p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center">
        <h2 className="text-[3.5rem] leading-[1.1] font-normal text-white mb-6 tracking-normal self-start w-full text-left">Welcome!</h2>
        <p className="text-zinc-400 text-lg font-light tracking-wide mb-20 leading-relaxed self-start w-full text-left">
          To your one - stop custom conversation portal for the corporate simulation program.
        </p>

        <div className="w-full flex flex-col items-center gap-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full max-w-sm h-14 text-lg font-semibold font-sans tracking-tight bg-white hover:bg-white hover:text-zinc-900 hover:scale-105 text-zinc-900 rounded-full flex items-center justify-center gap-4 transition-all duration-300 shadow-xl px-6"
            variant="ghost"
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                {/* Google Icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
          <p className="text-zinc-500 text-lg font-medium text-center">
            Sign in to access your account
          </p>
        </div>
        {error && (
          <p className="mt-4 text-xs text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
