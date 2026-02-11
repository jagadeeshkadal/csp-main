import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Home, MessageSquare, Menu, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { conversationAPI } from '@/lib/api';

// Duplicate interface and unused ref exported by accident removed here

export interface LeftNavbarRef {
  // No longer exposing internal methods, controlled by props
}

interface LeftNavbarProps {
  activeView: 'home' | 'chats' | 'submissions' | 'tutorials';
  onViewChange: (view: 'home' | 'chats' | 'submissions' | 'tutorials') => void;
  children?: React.ReactNode;
  className?: string;
  isMobile?: boolean;
  onMobileClose?: () => void;
  unreadCount?: number; // Added prop
}

export const LeftNavbar = forwardRef<LeftNavbarRef, LeftNavbarProps>(
  ({ activeView, onViewChange, children, className, isMobile, onMobileClose, unreadCount = 0 }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed (icon-only)

    // Internal fetching logic removed - relying on passed prop unreadCount

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
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 text-[9px] font-bold text-white bg-orange-600 rounded-full border border-background shadow-sm ring-1 ring-white/20">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="ml-3 flex items-center gap-2">
                  Chats
                  {unreadCount > 0 && (
                    <span className="min-w-[18px] h-4 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-orange-600 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              )}
            </Button>

            <Button
              variant={activeView === 'submissions' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start mb-1",
                isCollapsed ? "justify-center px-2" : "px-4"
              )}
              onClick={() => onViewChange('submissions')}
              title={isCollapsed ? 'Submissions' : undefined}
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">Submissions</span>}
            </Button>

            <Button
              variant={activeView === 'tutorials' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                isCollapsed ? "justify-center px-2" : "px-4"
              )}
              onClick={() => onViewChange('tutorials')}
              title={isCollapsed ? 'Tutorials' : undefined}
            >
              <Video className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">Tutorials</span>}
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

