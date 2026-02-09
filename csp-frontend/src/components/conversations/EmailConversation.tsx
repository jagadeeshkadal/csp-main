import { useState, useEffect, useRef } from 'react';
import { conversationAPI, authAPI } from '@/lib/api';
import type { EmailMessage, EmailConversation as EmailConv, AIAgent } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mail, Bot, User, Clock, ChevronDown, ChevronUp, Loader2, Mic, Download, ArrowLeft, Paperclip } from 'lucide-react';
import { getUserData } from '@/lib/storage';
import { Textarea } from '@/components/ui/textarea';
import { HistoryDownloadModal } from '../agents/HistoryDownloadModal';
import { getAuth, type User as FirebaseUser } from 'firebase/auth';

interface EmailConversationProps {
  agent: AIAgent | null;
  conversationId: string | null;
  onUnreadChange?: () => void;
  onVoiceClick?: () => void;
  onBack?: () => void;
}

export function EmailConversation({ agent, conversationId, onUnreadChange, onVoiceClick, onBack }: EmailConversationProps) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [conversation, setConversation] = useState<EmailConv | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationIdRef = useRef<string | null>(conversationId); // Track current conversation
  const userData = getUserData();
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Listen for Firebase auth state to get photoURL
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch fresh user data on mount to ensure avatar is in localStorage
  useEffect(() => {
    authAPI.getCurrentUser().catch(err => {
      console.error('[EmailConversation] Failed to fetch user data:', err);
    });
  }, []);

  useEffect(() => {
    // Update ref to track current conversation
    conversationIdRef.current = conversationId;

    // CRITICAL: Clear messages immediately when conversation changes to prevent leakage
    setMessages([]);
    setConversation(null);
    setExpandedMessages(new Set());

    if (conversationId) {
      loadConversation(false); // Initial load without animation
      // Mark agent messages as read when conversation is viewed
      conversationAPI.markMessagesAsRead(conversationId).then(() => {
        console.log('[EmailConversation] Messages marked as read, refreshing unread status...');
        // Wait a bit for backend to update, then refresh
        setTimeout(() => {
          // Notify parent to refresh unread count
          console.log('[EmailConversation] Calling onUnreadChange callback');
          onUnreadChange?.();
        }, 500);
      }).catch(err => {
        console.error('Failed to mark messages as read:', err);
      });

      // Refresh messages after a short delay to catch welcome message if it was just created
      const refreshTimer = setTimeout(() => {
        loadConversation(false); // First refresh without animation
      }, 1000);

      // Set up auto-refresh with random interval around 60 seconds (45-75 seconds)
      const scheduleNextRefresh = () => {
        // Random interval between 45-75 seconds (around 60 seconds)
        const randomInterval = 45000 + Math.random() * 30000; // 45s to 75s
        console.log(`[EmailConversation] Next auto - refresh in ${Math.round(randomInterval / 1000)} seconds`);

        refreshIntervalRef.current = setTimeout(() => {
          console.log('[EmailConversation] Auto-refreshing conversation...');
          loadConversation(false); // Subsequent refreshes WITHOUT animation to prevent flickering
          // Schedule next refresh
          scheduleNextRefresh();
        }, randomInterval);
      };

      // Start the first random refresh
      scheduleNextRefresh();

      return () => {
        clearTimeout(refreshTimer);
        if (refreshIntervalRef.current) {
          clearTimeout(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    } else {
      setIsRefreshing(false);
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
  }, [conversationId]);

  useEffect(() => {
    // Auto-expand all messages when they first load
    if (messages.length > 0 && expandedMessages.size === 0) {
      setExpandedMessages(new Set(messages.map(m => m.id)));
    }
    scrollToBottom();
  }, [messages]);

  const loadConversation = async (animate: boolean = true) => {
    if (!conversationId) return;

    const hadMessages = messages.length > 0;

    try {
      // If this is a refresh (not initial load), animate the transition
      if (animate && hadMessages) {
        setIsRefreshing(true);
        // Wait for fade-out animation (300ms)
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        setLoading(true);
      }

      console.log('Loading conversation:', conversationId);
      const [convResponse, messagesResponse] = await Promise.all([
        conversationAPI.getConversation(conversationId),
        conversationAPI.getMessages(conversationId),
      ]);
      console.log('Conversation loaded:', convResponse.conversation);
      console.log('Messages loaded:', messagesResponse.messages.length);
      setConversation(convResponse.conversation);
      setMessages(messagesResponse.messages);

      // If animated, wait a bit for fade-in
      if (animate && hadMessages) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setIsRefreshing(false);
      // Show error to user
      alert('Failed to load conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !conversationId || sending) return;

    // Capture the current conversation ID to prevent message leakage
    const targetConversationId = conversationId;
    const messageText = messageContent.trim();

    // Clear input immediately
    setMessageContent('');

    // Create optimistic message (show immediately in UI)
    const optimisticMessage: EmailMessage = {
      id: `temp - ${Date.now()} `, // Temporary ID
      conversationId: targetConversationId,
      senderType: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRead: true,
    };

    // Add optimistic message to UI immediately (only if still on same conversation)
    if (conversationIdRef.current === targetConversationId) {
      setMessages((prev) => [...prev, optimisticMessage]);
    }
    setSending(true);

    // Send message in background (non-blocking)
    (async () => {
      try {
        // Only proceed if still on the same conversation
        if (conversationIdRef.current !== targetConversationId) {
          console.log('[EmailConversation] Conversation changed, canceling send for:', targetConversationId);
          setSending(false);
          return;
        }

        setWaitingForAgent(true);

        // Send the message to backend
        const response = await conversationAPI.sendMessage(targetConversationId, messageText);

        // Replace optimistic message with real message (ONLY if still on same conversation)
        if (conversationIdRef.current === targetConversationId) {
          setMessages((prev) => {
            // Remove the optimistic message and add the real one
            const filtered = prev.filter(m => m.id !== optimisticMessage.id);
            return [...filtered, response.message];
          });
        } else {
          console.log('[EmailConversation] Conversation changed after send, not updating messages');
          setSending(false);
          setWaitingForAgent(false);
          return;
        }

        // Wait a bit for agent response to be generated
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Poll for agent response (check every 2 seconds, max 30 seconds)
        let attempts = 0;
        const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds max

        const checkForAgentResponse = async () => {
          attempts++;

          // Stop polling if conversation changed
          if (conversationIdRef.current !== targetConversationId) {
            console.log('[EmailConversation] Conversation changed, stopping poll for:', targetConversationId);
            setWaitingForAgent(false);
            return;
          }

          try {
            const messagesResponse = await conversationAPI.getMessages(targetConversationId);
            const latestMessage = messagesResponse.messages[messagesResponse.messages.length - 1];

            // Check if the latest message is from agent and is newer than our sent message
            if (latestMessage && latestMessage.senderType === 'agent') {
              const messageTime = new Date(latestMessage.createdAt).getTime();
              const sentTime = new Date(response.message.createdAt).getTime();

              if (messageTime > sentTime) {
                // Agent responded! Update messages only if still on same conversation
                if (conversationIdRef.current === targetConversationId) {
                  setMessages(messagesResponse.messages);
                }
                setWaitingForAgent(false);
                return;
              }
            }

            // If we haven't found agent response and haven't exceeded max attempts, check again
            if (attempts < maxAttempts) {
              setTimeout(checkForAgentResponse, 2000);
            } else {
              // Timeout - refresh conversation to get latest state (only if still on same conversation)
              console.log('[EmailConversation] Timeout waiting for agent response, refreshing...');
              if (conversationIdRef.current === targetConversationId) {
                await loadConversation(true); // Use animation for refresh
              }
              setWaitingForAgent(false);
            }
          } catch (error) {
            console.error('Error checking for agent response:', error);
            if (attempts < maxAttempts && conversationIdRef.current === targetConversationId) {
              setTimeout(checkForAgentResponse, 2000);
            } else {
              setWaitingForAgent(false);
            }
          }
        };

        // Start checking for agent response
        setTimeout(checkForAgentResponse, 2000);

      } catch (error) {
        console.error('Failed to send message:', error);
        // Remove optimistic message on error (only if still on same conversation)
        if (conversationIdRef.current === targetConversationId) {
          setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
        }
        setWaitingForAgent(false);
      } finally {
        setSending(false);
      }
    })();
  };

  const toggleMessage = (messageId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const toggleDetails = (messageId: string) => {
    setExpandedDetails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const getMessagePreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} `;
    } else if (days === 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} `;
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!agent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select an agent to start an email conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-x-hidden">
      {/* Simple Header - Agent Name Only (Gmail Style) */}
      <div className="border-b bg-card p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onBack}
                title="Back to chats"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {/* Agent Avatar */}
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}
            {/* Agent Name */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold truncate">{agent.name}</h2>
              {agent.location && (
                <p className="text-xs text-muted-foreground truncate">{agent.location}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDownloadModalOpen(true)}
              title="Download chat history"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <HistoryDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        agent={agent}
        conversationId={conversationId}
      />

      {/* Email Thread Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="py-4 px-3 md:px-4 break-words overflow-x-hidden">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading email thread...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm">Start the email conversation by sending a message below</p>
            </div>
          ) : (
            <div className={`space - y - 0 transition - opacity duration - 300 ${isRefreshing ? 'opacity-0' : 'opacity-100'} `}>
              {messages.map((message, index) => {
                const isExpanded = expandedMessages.has(message.id);
                const isLast = index === messages.length - 1;

                return (
                  <div
                    key={message.id}
                    className="transition-all duration-300"
                    style={{
                      animation: isRefreshing ? 'none' : 'fadeIn 0.3s ease-in'
                    }}
                  >
                    <div
                      className="relative px-3 py-4 md:px-8 md:py-5 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => toggleMessage(message.id)}
                    >
                      <div className="flex items-start gap-3 md:gap-5">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {message.senderType === 'agent' ? (
                            agent.avatar ? (
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-background"
                              />
                            ) : (
                              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background">
                                <Bot className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                              </div>
                            )
                          ) : (
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                              <User className="h-4 w-4 md:h-6 md:w-6 text-zinc-900 dark:text-zinc-100" />
                            </div>
                          )}
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Sender Name and Email */}
                              <div className="mb-1">
                                <span className="font-semibold text-sm">
                                  {message.senderType === 'agent' ? agent.name : (userData?.name || 'You')}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2 break-words">
                                  &lt;{message.senderType === 'agent'
                                    ? `${agent.name.toLowerCase().replace(/\s+/g, '.')} @ai-assistant.com`
                                    : (userData?.email || 'user@example.com')}
                                  &gt;
                                </span>
                              </div>

                              {/* Recipient with Dropdown */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-muted-foreground">
                                  to: {message.senderType === 'agent' ? 'me' : agent.name}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDetails(message.id);
                                  }}
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                                >
                                  {expandedDetails.has(message.id) ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                              </div>

                              {/* Expandable Details */}
                              {expandedDetails.has(message.id) && (
                                <div className="text-xs text-muted-foreground space-y-1 mb-3 p-2 bg-muted/30 rounded border border-border/50 break-words">
                                  <div>From: {message.senderType === 'agent'
                                    ? `${agent.name.toLowerCase().replace(/\s+/g, '.')} @ai-assistant.com`
                                    : (userData?.email || 'user@example.com')}
                                  </div>
                                  <div>To: {message.senderType === 'agent'
                                    ? (userData?.email || 'user@example.com')
                                    : `${agent.name.toLowerCase().replace(/\s+/g, '.')} @ai-assistant.com`}
                                  </div>
                                  <div>Date: {formatEmailDate(message.createdAt)}</div>
                                </div>
                              )}

                              {/* Message Content */}
                              <div className="text-sm whitespace-pre-wrap leading-relaxed mt-2 break-words">
                                {isExpanded ? message.content : (
                                  <div className="line-clamp-2 text-muted-foreground break-words">
                                    {getMessagePreview(message.content)}
                                  </div>
                                )}
                              </div>
                            </div>


                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal divider - edge to edge, except for last message */}
                    {!isLast && (
                      <div className="border-b border-border"></div>
                    )}
                  </div>
                );
              })}

              {/* Loading indicator when waiting for agent response */}
              {waitingForAgent && (
                <div className="px-8 py-4 flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="flex flex-col">
                    <span>Email sent</span>
                    <span>Waiting for the response...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Email Composition Area */}
      <div className="border-t bg-card p-3 md:p-4">
        <div className="space-y-3">
          <Textarea
            placeholder="Type your email message here..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            disabled={sending || !conversationId}
            className="min-h-[120px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to send
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Voice Button (Mobile Only) */}
              {onVoiceClick && (
                <Button
                  onClick={onVoiceClick}
                  variant="outline"
                  size="sm"
                  className="md:hidden"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || sending || !conversationId}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
