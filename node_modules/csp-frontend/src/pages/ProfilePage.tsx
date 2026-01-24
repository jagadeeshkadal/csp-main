import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { getCurrentUser as getFirebaseUser } from '@/lib/firebase';
import { getUserData } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, Moon, Sun, User } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { User as FirebaseUser } from 'firebase/auth';

export function ProfilePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<{
    id: string;
    phoneNumber: string;
    phoneExtension: string;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarUrlRef = useRef<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneExtension: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get Firebase user FIRST and cache photoURL immediately
        const currentUser = getFirebaseUser();
        setFirebaseUser(currentUser);
        
        // Always cache avatar URL from Firebase immediately - this is the source of truth
        if (currentUser?.photoURL) {
          const photoURL = currentUser.photoURL;
          setAvatarUrl(photoURL);
          avatarUrlRef.current = photoURL; // Persist in ref immediately
        }

        // Fetch user data from backend (this might not have avatar, but that's OK)
        const response = await authAPI.getCurrentUser();
        setUserData(response.user);
        setFormData({
          name: response.user.name || '',
          email: response.user.email || '',
          phoneExtension: response.user.phoneExtension || '',
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // If token is invalid, redirect to login
        navigate('/', { replace: true });
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Always update avatar URL when Firebase user changes - NEVER clear it
  useEffect(() => {
    if (firebaseUser?.photoURL) {
      const url = firebaseUser.photoURL;
      // Always set it, even if already set (ensures it never gets lost)
      setAvatarUrl(url);
      avatarUrlRef.current = url; // Persist in ref - this is our permanent cache
    }
  }, [firebaseUser?.photoURL]);

  // Update ref when avatarUrl changes - but never clear it if it's a Firebase URL
  useEffect(() => {
    if (avatarUrl) {
      avatarUrlRef.current = avatarUrl;
    } else if (firebaseUser?.photoURL) {
      // If avatarUrl is cleared but we have Firebase photoURL, restore it
      const url = firebaseUser.photoURL;
      setAvatarUrl(url);
      avatarUrlRef.current = url;
    }
  }, [avatarUrl, firebaseUser?.photoURL]);

  // Memoize the avatar URL - Firebase photoURL is always the priority
  const displayAvatarUrl = useMemo(() => {
    // Priority: Firebase photoURL > cached avatarUrl > ref > userData avatar
    return firebaseUser?.photoURL || avatarUrl || avatarUrlRef.current || userData?.avatar || null;
  }, [firebaseUser?.photoURL, avatarUrl, userData?.avatar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await authAPI.updateUser({
        name: formData.name || null,
        email: formData.email || null,
        phoneExtension: formData.phoneExtension,
      });

      setUserData(response.user);
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Profile Picture Display */}
            <div className="flex flex-col items-center mb-6">
              {displayAvatarUrl ? (
                <img 
                  src={displayAvatarUrl} 
                  alt={userData?.name || firebaseUser?.displayName || 'User'}
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  onError={(e) => {
                    // NEVER clear Firebase URLs - they are the source of truth
                    // If it's a Firebase URL, restore it from Firebase
                    if (firebaseUser?.photoURL) {
                      // Restore from Firebase
                      setAvatarUrl(firebaseUser.photoURL);
                      avatarUrlRef.current = firebaseUser.photoURL;
                    } else if (displayAvatarUrl !== firebaseUser?.photoURL) {
                      // Only clear non-Firebase URLs, and only if we don't have Firebase
                      setAvatarUrl((prev) => {
                        // Don't clear if it's a Firebase URL or if we have Firebase available
                        if (firebaseUser?.photoURL) {
                          return firebaseUser.photoURL;
                        }
                        return prev === firebaseUser?.photoURL ? prev : null;
                      });
                    }
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                  <User className="h-12 w-12 text-primary" />
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Profile picture from Google account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="text"
                  value={userData.phoneNumber}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Phone number cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneExtension">Phone Extension</Label>
                <Input
                  id="phoneExtension"
                  type="text"
                  value={formData.phoneExtension}
                  onChange={(e) => setFormData({ ...formData, phoneExtension: e.target.value })}
                  placeholder="e.g., +91"
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    <Label htmlFor="dark-mode" className="cursor-pointer">
                      Dark Mode
                    </Label>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={() => toggleTheme()}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/home')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
