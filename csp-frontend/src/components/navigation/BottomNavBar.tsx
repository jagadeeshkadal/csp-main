import { Home, MessageCircle, FileText, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavBarProps {
    activeView: 'home' | 'chats' | 'submissions' | 'tutorials';
    onViewChange: (view: 'home' | 'chats' | 'submissions' | 'tutorials') => void;
    unreadCount?: number;
}

export function BottomNavBar({ activeView, onViewChange, unreadCount = 0 }: BottomNavBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden z-40">
            <div className="flex items-center justify-around h-16">
                {/* Home Tab */}
                <button
                    onClick={() => onViewChange('home')}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                        activeView === 'home'
                            ? "text-primary dark:text-foreground"
                            : "text-muted-foreground dark:text-foreground/70"
                    )}
                >
                    <Home className="h-6 w-6" />
                    <span className="text-xs mt-1">Home</span>
                </button>

                {/* Chats Tab */}
                <button
                    onClick={() => onViewChange('chats')}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
                        activeView === 'chats'
                            ? "text-primary dark:text-foreground"
                            : "text-muted-foreground dark:text-foreground/70"
                    )}
                >
                    <div className="relative">
                        <MessageCircle className="h-6 w-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold ring-1 ring-white/20">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <span className="text-xs mt-1">Chats</span>
                </button>

                {/* Submissions Tab */}
                <button
                    onClick={() => onViewChange('submissions')}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                        activeView === 'submissions'
                            ? "text-primary dark:text-foreground"
                            : "text-muted-foreground dark:text-foreground/70"
                    )}
                >
                    <FileText className="h-6 w-6" />
                    <span className="text-xs mt-1">Submissions</span>
                </button>

                {/* Tutorials Tab */}
                <button
                    onClick={() => onViewChange('tutorials')}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                        activeView === 'tutorials'
                            ? "text-primary dark:text-foreground"
                            : "text-muted-foreground dark:text-foreground/70"
                    )}
                >
                    <Video className="h-6 w-6" />
                    <span className="text-xs mt-1">Tutorials</span>
                </button>
            </div>
        </div>
    );
}
