import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Home, MessageSquare, Menu, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { conversationAPI } from '@/lib/api';

interface LeftNavbarProps {
  activeView: 'home' | 'chats' | 'submissions';
  onViewChange: (view: 'home' | 'chats' | 'submissions') => void;
  children?: React.ReactNode;
  className?: string;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export interface LeftNavbarRef {
  refreshUnreadCount: () => void;
}

export const LeftNavbar = forwardRef<LeftNavbarRef, LeftNavbarProps>(
  ({ activeView, onViewChange, children, className, isMobile, onMobileClose }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed (icon-only)
    const [unreadCount, setUnreadCount] = useState(0);

    const checkUnreadMessages = useCallback(async () => {
      try {
        console.log('[LeftNavbar] checkUnreadMessages called');
        const response = await conversationAPI.getConversations();
        const conversations = response.conversations;

        // Count total unread agent messages across all conversations
        // Only count messages from active agents
        let totalUnread = 0;

        for (const conversation of conversations) {
          // Skip if agent is inactive
          if (conversation.agent && !conversation.agent.isActive) {
            continue;
          }

          if (conversation.messages) {
            const unreadInConversation = conversation.messages.filter(
              (msg) => {
                const isAgent = msg.senderType && msg.senderType.toLowerCase() === 'agent';
                // Handle string "false" or boolean false
                const isRead = String(msg.isRead) === 'true';
                const isUnread = !isRead;
                return isAgent && isUnread;
              }
            ).length;
            totalUnread += unreadInConversation;
          }
        }

        console.log('[LeftNavbar] Total unread count:', totalUnread);
        setUnreadCount(totalUnread);
      } catch (err) {
        console.error('Failed to check unread messages:', err);
        // Don't show error to user, just silently fail
      }
    }, []);

    // Expose refresh function via ref
    useImperativeHandle(ref, () => ({
      refreshUnreadCount: () => {
        console.log('[LeftNavbar] refreshUnreadCount called via ref');
        checkUnreadMessages();
      },
    }), [checkUnreadMessages]);

    // Fetch conversations to count total unread messages
    useEffect(() => {
      checkUnreadMessages();

      // Refresh unread count periodically (every 30 seconds)
      const interval = setInterval(checkUnreadMessages, 30000);

      return () => clearInterval(interval);
    }, [checkUnreadMessages]);

    return (
      <div className={cn("flex h-full", className)}>
        {/* Navigation Icons */}
        <div className={cn(
          "border-r bg-card flex flex-col transition-all duration-300 flex-shrink-0",
          isMobile ? "w-full" : (isCollapsed ? "w-20" : "w-64")
        )}>

          {/* Hamburger Menu Button - Top */}
          <div className={cn("p-2 border-b flex", isCollapsed ? "justify-center" : "justify-start")}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Menu' : 'Collapse Menu'}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-2">
            <Button
              variant={activeView === 'home' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start mb-1",
                isCollapsed ? "justify-center px-2" : "px-4"
              )}
              onClick={() => onViewChange('home')}
              title={isCollapsed ? 'Home' : undefined}
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">Home</span>}
            </Button>

            <Button
              variant={activeView === 'chats' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start relative mb-1",
                isCollapsed ? "justify-center px-2" : "px-4"
              )}
              onClick={() => onViewChange('chats')}
              title={isCollapsed ? 'Chats' : undefined}
            >
              <div className="relative flex-shrink-0">
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-semibold text-white bg-destructive rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="ml-3 flex items-center gap-2">
                  Chats
                  {unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-semibold text-white bg-destructive rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              )}
            </Button>

            <Button
              variant={activeView === 'submissions' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                isCollapsed ? "justify-center px-2" : "px-4"
              )}
              onClick={() => onViewChange('submissions')}
              title={isCollapsed ? 'Submissions' : undefined}
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">Submissions</span>}
            </Button>
          </div>
        </div>

        {/* Content Area - Only show for chats view */}
        {activeView === 'chats' && children && (
          <div className={cn(
            "border-r bg-background transition-all duration-300 overflow-hidden flex-shrink-0 w-80"
          )}>
            <div className="h-full w-80">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }
);

