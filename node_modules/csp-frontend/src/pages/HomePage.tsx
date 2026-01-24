import { useEffect, useState, useRef, useMemo } from 'react';
import { getCurrentUser, signOut as firebaseSignOut, getIdToken } from '@/lib/firebase';
import { getUserData, getUserId, getAuthToken } from '@/lib/storage';
import { authAPI, conversationAPI } from '@/lib/api';
import type { AIAgent } from '@/lib/api';
import { AgentSidebar, type AgentSidebarRef } from '@/components/agents/AgentSidebar';
import { EmailConversation } from '@/components/conversations/EmailConversation';
import { VoiceSidebar } from '@/components/conversations/VoiceSidebar';
import { LeftNavbar, type LeftNavbarRef } from '@/components/navigation/LeftNavbar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { User, LogOut, UserCircle } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: string;
  phoneNumber: string;
  phoneExtension: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  jwt?: string | null;
}

export function HomePage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'chats'>('chats');
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarUrlRef = useRef<string | null>(null);
  const leftNavbarRef = useRef<LeftNavbarRef>(null);
  const agentSidebarRef = useRef<AgentSidebarRef>(null);

  useEffect(() => {
    // Prevent multiple calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Safety timeout - ensure loading is always set to false after 10 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('fetchUserData took too long, setting loading to false');
      setLoading(false);
    }, 10000);

    const fetchUserData = async () => {
      try {
        console.log('[HomePage] Starting fetchUserData');
        // Get Firebase user FIRST and cache photoURL immediately
        const currentUser = getCurrentUser();
        console.log('[HomePage] Firebase user:', currentUser?.email || currentUser?.uid || 'none');
        setFirebaseUser(currentUser);
        
        // Always cache avatar URL from Firebase immediately - this is the source of truth
        if (currentUser?.photoURL) {
          const photoURL = currentUser.photoURL;
          setAvatarUrl(photoURL);
          avatarUrlRef.current = photoURL; // Persist in ref immediately
        }

        // Check if token exists
        let token = getAuthToken();
        console.log('[HomePage] Initial token:', token ? 'exists' : 'missing');
        
        // If no token but we have Firebase user, DON'T try to sign in automatically
        // This causes issues for new users who just signed up
        // Instead, check if user data exists in localStorage from signup
        if (!token && currentUser) {
          const storedUserData = getUserData();
          if (storedUserData) {
            console.log('[HomePage] No token but found stored user data, user needs to complete signup');
            setLoading(false);
            navigate('/', { replace: true });
            return;
          } else {
            // No stored data and no token - user needs to sign up
            console.log('[HomePage] No token and no stored data, redirecting to signup');
            setLoading(false);
            navigate('/', { replace: true });
            return;
          }
        }
        
        if (token) {
          try {
            console.log('[HomePage] Token exists, calling getCurrentUser');
            // Fetch user data from backend (this might not have avatar, but that's OK)
            const response = await authAPI.getCurrentUser();
            console.log('[HomePage] getCurrentUser succeeded, user ID:', response.user.id);
            setUserData(response.user);
            
            // Update avatar URL from userData if available
            if (response.user.avatar) {
              setAvatarUrl(response.user.avatar);
              avatarUrlRef.current = response.user.avatar;
            }
          } catch (error: any) {
            console.error('[HomePage] Failed to fetch user data:', error);
            console.error('[HomePage] Error details:', {
              status: error.response?.status,
              message: error.response?.data?.message || error.message,
            });
            // If getCurrentUser fails, don't try to sign in again - this causes loops
            // The token is invalid or expired, redirect to login
            console.log('[HomePage] getCurrentUser failed, token is invalid');
            setLoading(false);
            navigate('/', { replace: true });
            return;
          }
        } else {
          // No token available - user needs to sign up or sign in
          console.log('[HomePage] No token available, redirecting to login');
          setLoading(false);
          navigate('/', { replace: true });
          return;
        }
      } catch (error: any) {
        // Catch any unexpected errors
        console.error('Unexpected error in fetchUserData:', error);
        setLoading(false);
        // Don't redirect on unexpected errors, just show the page with whatever data we have
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    fetchUserData();

    // Cleanup function
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []); // Empty dependency array - only run once on mount

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

  const handleAgentSelect = async (agent: AIAgent) => {
    setSelectedAgent(agent);
    setConversationId(null); // Clear previous conversation while loading
    try {
      console.log('Creating/getting conversation for agent:', agent.id);
      console.log('User data:', userData);
      console.log('Auth token:', getAuthToken());
      
      // Check if we have a valid token
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        alert('Authentication error. Please sign out and sign in again.');
        return;
      }
      
      // Create or get existing conversation with this agent
      const response = await conversationAPI.createOrGetConversation(agent.id);
      console.log('Conversation created/retrieved:', response.conversation.id);
      setConversationId(response.conversation.id);
    } catch (error: any) {
      console.error('Failed to create/get conversation:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Show more detailed error to user
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start conversation';
      alert(`Failed to start conversation: ${errorMessage}. Please try again or sign out and sign in again.`);
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut();
    // All localStorage items are cleared in firebaseSignOut
    navigate('/');
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/pi-dot-logo.png" 
            alt="PI DOT" 
            className="w-auto object-contain"
            style={{ height: '24px', maxHeight: '24px' }}
          />
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {userData?.name || firebaseUser?.displayName || 'User'}
          </p>
          <DropdownMenu
            trigger={
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors overflow-hidden">
                {displayAvatarUrl ? (
                  <img 
                    src={displayAvatarUrl} 
                    alt={userData?.name || firebaseUser?.displayName || 'User'}
                    className="w-full h-full object-cover"
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
                  <User className="h-5 w-5 text-primary" />
                )}
              </button>
            }
            align="right"
          >
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Collapsible Navbar */}
        <LeftNavbar
          ref={leftNavbarRef}
          activeView={activeView}
          onViewChange={setActiveView}
        >
          {activeView === 'chats' && (
            <AgentSidebar
              ref={agentSidebarRef}
              selectedAgentId={selectedAgent?.id || null}
              onAgentSelect={handleAgentSelect}
              onUnreadChange={() => {
                console.log('[HomePage] onUnreadChange called from AgentSidebar');
                console.log('[HomePage] leftNavbarRef.current:', leftNavbarRef.current);
                console.log('[HomePage] agentSidebarRef.current:', agentSidebarRef.current);
                leftNavbarRef.current?.refreshUnreadCount();
                agentSidebarRef.current?.refreshUnreadStatus();
              }}
            />
          )}
        </LeftNavbar>
        
        {/* Main Content Area */}
        {activeView === 'chats' ? (
          <>
            <EmailConversation
              agent={selectedAgent}
              conversationId={conversationId}
              onUnreadChange={() => {
                console.log('[HomePage] onUnreadChange called from EmailConversation');
                console.log('[HomePage] leftNavbarRef.current:', leftNavbarRef.current);
                console.log('[HomePage] agentSidebarRef.current:', agentSidebarRef.current);
                leftNavbarRef.current?.refreshUnreadCount();
                agentSidebarRef.current?.refreshUnreadStatus();
              }}
            />
            {/* Right: Voice Sidebar */}
            <VoiceSidebar
              agent={selectedAgent}
              conversationId={conversationId}
              onClose={() => {}} // No close button needed for permanent sidebar
            />
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Dashboard />
          </div>
        )}
      </div>
    </div>
  );
}
