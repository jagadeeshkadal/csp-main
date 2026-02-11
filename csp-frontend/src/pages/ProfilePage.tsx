import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { getCurrentUser as getFirebaseUser } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, Moon, Sun, User, Pencil, Trash2, RotateCcw, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { DEPARTMENTS } from '@/lib/constants';

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

  // Custom Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({ message: '', type: 'success', visible: false });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // avatarUrl state:
  // - "NONE" : Explicitly removed (show placeholder)
  // - null   : Default (use Google/Firebase photo)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isViewingLarge, setIsViewingLarge] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneExtension: '',
    teamNumber: '',
    departmentName: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = getFirebaseUser();
        setFirebaseUser(currentUser);

        const response = await authAPI.getCurrentUser();
        setUserData(response.user);
        setFormData({
          name: response.user.name || '',
          email: response.user.email || '',
          phoneExtension: response.user.phoneExtension || '',
          teamNumber: response.user.teamNumber || '',
          departmentName: response.user.departmentName || '',
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await authAPI.updateUser({
        name: formData.name || null,
        email: formData.email || null,
        phoneExtension: formData.phoneExtension,
        teamNumber: formData.teamNumber || null,
        departmentName: formData.departmentName || null,
        avatar: null, // Always null
      });

      setUserData(response.user);
      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showToast(error.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 overflow-x-hidden">
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

        <Card className="border-border shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
            <CardDescription>
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Profile Picture Display - Static Default Icon */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-32 h-32 rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-600 shadow-lg">
                <User className="h-16 w-16 text-zinc-900 dark:text-zinc-100" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="h-11 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="h-11 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-semibold">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="text"
                    value={userData.phoneNumber}
                    disabled
                    className="h-11 bg-muted/30 cursor-not-allowed border-dashed"
                  />
                  <p className="text-[10px] text-muted-foreground px-1 italic">
                    Phone number is used for authentication and cannot be changed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentName" className="text-sm font-semibold">Department Name</Label>
                  <div className="relative">
                    <select
                      id="departmentName"
                      value={formData.departmentName}
                      onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                      className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm appearance-none"
                    >
                      <option value="" disabled>Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamNumber" className="text-sm font-semibold">Team Number</Label>
                  <Input
                    id="teamNumber"
                    type="text"
                    value={formData.teamNumber}
                    onChange={(e) => setFormData({ ...formData, teamNumber: e.target.value })}
                    placeholder="Enter your team number"
                    className="h-11 shadow-sm"
                  />
                </div>

              </div>


              <div className="space-y-2 pt-6 border-t mt-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border dark:border-white/20 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg border border-border">
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-primary" />
                      ) : (
                        <Sun className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dark-mode" className="font-bold text-base cursor-pointer">
                        Interface Theme
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Toggle between light and dark mode
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={() => toggleTheme()}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto min-w-[180px] h-11 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Custom Toast - Top Right (Mobile), Bottom Right (Desktop) */}
      {toast.visible && (
        <div className="fixed top-6 right-6 md:top-auto md:bottom-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md",
            toast.type === 'success'
              ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}>
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
