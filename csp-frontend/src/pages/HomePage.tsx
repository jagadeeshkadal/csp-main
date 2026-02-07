import { useEffect, useState, useRef, useMemo } from 'react';
import { getCurrentUser, signOut as firebaseSignOut } from '@/lib/firebase';
import { getUserData, getAuthToken } from '@/lib/storage';
import { authAPI, conversationAPI } from '@/lib/api';
import type { AIAgent } from '@/lib/api';
import { AgentSidebar, type AgentSidebarRef } from '@/components/agents/AgentSidebar';
import { EmailConversation } from '@/components/conversations/EmailConversation';
import { VoiceSidebar } from '@/components/conversations/VoiceSidebar';
import { LeftNavbar, type LeftNavbarRef } from '@/components/navigation/LeftNavbar';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { User, LogOut, UserCircle } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [activeView, setActiveView] = useState<'home' | 'chats'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const leftNavbarRef = useRef<LeftNavbarRef>(null);
  const agentSidebarRef = useRef<AgentSidebarRef>(null);
  const selectedAgentRef = useRef<AIAgent | null>(null);

  useEffect(() => {
    // Prevent multiple calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const fetchUserData = async () => {
      try {
        const currentUser = getCurrentUser();
        setFirebaseUser(currentUser);

        let token = getAuthToken();

        if (token) {
          try {
            const response = await authAPI.getCurrentUser();
            setUserData(response.user);
          } catch (error: any) {
            console.error('[HomePage] Failed to fetch user data:', error);
            setLoading(false);
            navigate('/', { replace: true });
            return;
          }
        } else {
          setLoading(false);
          navigate('/', { replace: true });
          return;
        }
      } catch (error: any) {
        console.error('Unexpected error in fetchUserData:', error);
        setLoading(false);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    fetchUserData();
    return () => clearTimeout(safetyTimeout);
  }, [navigate]);

  // Unified avatar resolution logic
  const displayAvatarUrl = useMemo(() => {
    const avatar = userData?.avatar;
    // NONE means explicitly removed by user
    if (avatar === "NONE") return null;
    // If we have a custom avatar, use it
    if (avatar) return avatar;
    // Otherwise, fall back to login source (Google/Firebase)
    return firebaseUser?.photoURL || null;
  }, [userData?.avatar, firebaseUser?.photoURL]);

  const handleAgentSelect = async (agent: AIAgent) => {
    // Add a history entry so mobile back/swipe returns to the agent list
    if (!selectedAgentRef.current) {
      window.history.pushState({ view: 'agent', agentId: agent.id }, '');
    } else if (selectedAgentRef.current.id !== agent.id) {
      window.history.replaceState({ view: 'agent', agentId: agent.id }, '');
    }

    setSelectedAgent(agent);
    selectedAgentRef.current = agent;
    setConversationId(null);
    try {
      const response = await conversationAPI.createOrGetConversation(agent.id);
      setConversationId(response.conversation.id);
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut();
    navigate('/');
  };

  const resetToAgentList = () => {
    setIsVoiceOpen(false);
    setSelectedAgent(null);
    setConversationId(null);
    selectedAgentRef.current = null;
  };

  const handleBackToList = () => {
    if (selectedAgentRef.current) {
      window.history.back();
    }
  };

  const handleMobileViewChange = (view: 'home' | 'chats') => {
    setActiveView(view);
    if (view === 'chats') {
      if (selectedAgentRef.current) {
        window.history.back();
      }
    } else {
      setIsVoiceOpen(false);
    }
  };

  useEffect(() => {
    selectedAgentRef.current = selectedAgent;
  }, [selectedAgent]);

  useEffect(() => {
    const handlePopState = () => {
      if (selectedAgentRef.current && activeView === 'chats') {
        resetToAgentList();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView]);

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <img
            src="/pi-dot-logo.png"
            alt="PI DOT"
            className="w-auto object-contain"
            style={{ height: '24px', maxHeight: '24px' }}
          />
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground mr-2">
            {userData?.name || firebaseUser?.displayName || 'User'}
          </p>
          <DropdownMenu
            trigger={
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-all overflow-hidden border border-border/50">
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt={userData?.name || firebaseUser?.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-zinc-500" />
                )}

              </button>
            }
            align="right"
          >
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative pb-16 md:pb-0">
        {/* Desktop Navbar - Hidden on mobile */}
        <LeftNavbar
          ref={leftNavbarRef}
          activeView={activeView}
          onViewChange={setActiveView}
          className="hidden md:flex">
          {activeView === 'chats' && (
            <AgentSidebar
              ref={agentSidebarRef}
              selectedAgentId={selectedAgent?.id || null}
              onAgentSelect={handleAgentSelect}
              onUnreadChange={() => {
                leftNavbarRef.current?.refreshUnreadCount();
                agentSidebarRef.current?.refreshUnreadStatus();
              }}
            />
          )}
        </LeftNavbar>

        {/* Main Content Area */}
        {activeView === 'chats' ? (
          <>
            {/* Mobile: Show agent list when no agent selected, conversation when agent selected */}
            <div className="flex-1 flex overflow-hidden md:hidden">
              {!selectedAgent ? (
                // Mobile agent list (full screen)
                <div className="flex-1 overflow-hidden">
                  <AgentSidebar
                    selectedAgentId={null}
                    onAgentSelect={handleAgentSelect}
                    onUnreadChange={() => {
                      leftNavbarRef.current?.refreshUnreadCount();
                    }}
                  />
                </div>
              ) : (
                // Mobile conversation view
                <>
                  <EmailConversation
                    agent={selectedAgent}
                    conversationId={conversationId}
                    onUnreadChange={() => {
                      leftNavbarRef.current?.refreshUnreadCount();
                      agentSidebarRef.current?.refreshUnreadStatus();
                    }}
                    onBack={handleBackToList}
                    onVoiceClick={() => setIsVoiceOpen(true)}
                  />
                  {/* Voice Sidebar - Desktop: right sidebar, Mobile: bottom sheet */}
                  <VoiceSidebar
                    agent={selectedAgent}
                    conversationId={conversationId}
                    onClose={() => setIsVoiceOpen(false)}
                    className={cn(
                      "bg-background transition-all duration-300",
                      // Mobile: bottom sheet (60% height, rounded top, slides up)
                      isVoiceOpen
                        ? "fixed bottom-0 left-0 right-0 z-50 w-full flex flex-col rounded-t-3xl shadow-2xl h-[60vh] md:hidden"
                        : "hidden",
                      // Desktop: regular sidebar (unchanged)
                      "md:flex md:static md:h-full md:rounded-none md:shadow-none"
                    )}
                  />
                </>
              )}
            </div>

            {/* Desktop: Show everything normally */}
            <div className="hidden md:flex flex-1 overflow-hidden">
              <EmailConversation
                agent={selectedAgent}
                conversationId={conversationId}
                onUnreadChange={() => {
                  leftNavbarRef.current?.refreshUnreadCount();
                  agentSidebarRef.current?.refreshUnreadStatus();
                }}
                onBack={handleBackToList}
                onVoiceClick={() => setIsVoiceOpen(true)}
              />
              {/* Voice Sidebar - Desktop only */}
              <VoiceSidebar
                agent={selectedAgent}
                conversationId={conversationId}
                onClose={() => setIsVoiceOpen(false)}
                className="bg-background"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Dashboard />
          </div>
        )}
      </div>

      <BottomNavBar
        activeView={activeView}
        onViewChange={handleMobileViewChange}
        unreadCount={0}
      />
    </div>
  );
}
