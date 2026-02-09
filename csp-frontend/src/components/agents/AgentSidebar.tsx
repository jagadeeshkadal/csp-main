import { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { agentAPI, conversationAPI } from '@/lib/api';
import type { AIAgent } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Search, Bot, ChevronDown, Check, X, Pin } from 'lucide-react';


interface AgentSidebarProps {
  selectedAgentId: string | null;
  onAgentSelect: (agent: AIAgent) => void;
  onUnreadChange?: () => void;
}

export interface AgentSidebarRef {
  refreshUnreadStatus: () => void;
}

export const AgentSidebar = forwardRef<AgentSidebarRef, AgentSidebarProps>(
  ({ selectedAgentId, onAgentSelect, onUnreadChange }, ref) => {
    const [agents, setAgents] = useState<AIAgent[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unreadAgents, setUnreadAgents] = useState<Set<string>>(new Set());
    const [pinnedAgents, setPinnedAgents] = useState<Set<string>>(new Set());
    const [conversations, setConversations] = useState<Map<string, string>>(new Map()); // agentId -> conversationId

    useEffect(() => {

      const fetchAgents = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await agentAPI.getAllAgents();
          setAgents(response.agents);
          setAllAgents(response.agents); // Store all agents for filtering
        } catch (err: any) {
          console.error('Failed to fetch agents:', err);
          setError('Failed to load agents');
        } finally {
          setLoading(false);
        }
      };

      fetchAgents();
    }, []);

    // Load pinned agents from localStorage
    useEffect(() => {
      const pinned = localStorage.getItem('pinnedAgents');
      if (pinned) {
        try {
          setPinnedAgents(new Set(JSON.parse(pinned)));
        } catch (e) {
          console.error('Failed to parse pinned agents:', e);
        }
      }
    }, []);

    // Function to check and update unread messages
    const checkUnreadMessages = useCallback(async () => {
      try {
        console.log('[AgentSidebar] checkUnreadMessages called');
        const response = await conversationAPI.getConversations();
        const conversationsList = response.conversations;

        // Check each conversation for unread agent messages
        const unreadSet = new Set<string>();
        const conversationMap = new Map<string, string>();

        for (const conversation of conversationsList) {
          if (conversation.agentId) {
            // Skip if agent is inactive
            if (conversation.agent && !conversation.agent.isActive) {
              continue;
            }

            conversationMap.set(conversation.agentId, conversation.id);

            if (conversation.messages) {
              // Check if there are any unread agent messages
              // Check if there are any unread agent messages
              const hasUnreadAgentMessage = conversation.messages.some(
                (msg) => {
                  const isAgent = msg.senderType && msg.senderType.toLowerCase() === 'agent';
                  // Handle string "false" or boolean false
                  const isRead = String(msg.isRead) === 'true';
                  const isUnread = !isRead;
                  return isAgent && isUnread;
                }
              );

              if (hasUnreadAgentMessage) {
                unreadSet.add(conversation.agentId);
              }
            }
          }
        }

        console.log('[AgentSidebar] Unread agents:', Array.from(unreadSet));
        setUnreadAgents(unreadSet);
        setConversations(conversationMap);
      } catch (err) {
        console.error('Failed to check unread messages:', err);
        // Don't show error to user, just silently fail
      }
    }, []);

    // Expose refresh function via ref
    useImperativeHandle(ref, () => ({
      refreshUnreadStatus: () => {
        console.log('[AgentSidebar] refreshUnreadStatus called via ref');
        checkUnreadMessages();
      },
    }), [checkUnreadMessages]);

    // Fetch conversations to check for unread messages
    useEffect(() => {
      checkUnreadMessages();

      // Refresh unread status periodically (every 30 seconds)
      const interval = setInterval(checkUnreadMessages, 30000);

      return () => clearInterval(interval);
    }, [checkUnreadMessages]);

    // Store all agents fetched from backend
    const [allAgents, setAllAgents] = useState<AIAgent[]>([]);

    // Filtered agents based on search term (client-side filtering)
    const filteredAgents = useMemo(() => {
      if (searchTerm.trim() === '') {
        return allAgents;
      }

      const lowerSearch = searchTerm.toLowerCase();
      return allAgents.filter(agent => {
        // Split agent name into words (by spaces, &, and other separators)
        const words = agent.name.toLowerCase().split(/[\s&]+/);
        // Check if any word starts with the search term
        return words.some(word => word.startsWith(lowerSearch));
      });
    }, [allAgents, searchTerm]);

    return (
      <div className="w-full md:w-80 bg-background flex flex-col h-full overflow-hidden">
        <div className="p-3 md:p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">AI Agents</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">

          {loading && agents.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Loading agents...</div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">{error}</div>
          ) : (
            <div className="p-2">
              {(() => {
                // Separate agents into active conversations and all agents
                const agentsWithConversations = filteredAgents.filter(agent => {
                  const hasConversation = conversations.has(agent.id);
                  // Only show active agents with conversations
                  return hasConversation && agent.isActive;
                });

                const allAgentsList = filteredAgents.filter(agent => agent.isActive);

                const renderAgentItem = (agent: typeof filteredAgents[0]) => {
                  const conversationId = conversations.get(agent.id);
                  const isPinned = pinnedAgents.has(agent.id);
                  const hasUnread = unreadAgents.has(agent.id);

                  return (
                    <div key={agent.id} className="mb-2 group relative">
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-auto py-3 px-3 overflow-hidden text-left relative pr-10 z-0 ${selectedAgentId === agent.id
                          ? 'bg-muted hover:bg-muted'
                          : 'hover:bg-muted/50'
                          }`}
                        onClick={() => onAgentSelect(agent)}
                      >
                        <div className="flex items-start gap-3 w-full min-w-0 max-w-full relative z-0">
                          <div className="flex-shrink-0 mt-1">
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
                          </div>
                          <div className="flex-1 text-left min-w-0 max-w-full">
                            <div className="flex items-center gap-2">
                              {isPinned && (
                                <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className="font-medium break-words whitespace-normal">{agent.name}</div>
                            </div>
                            {agent.description && (
                              <div className="text-xs text-muted-foreground mt-1 break-words whitespace-normal">
                                {agent.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </Button>

                      {/* Dropdown area with notification dot */}
                      {conversationId && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                          {/* Unread indicator - always visible, positioned above dropdown button */}
                          {hasUnread && (
                            <div className="absolute -top-1.5 right-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 z-20" title="Unread messages" />
                          )}
                          {/* Dropdown Menu - Show on hover */}
                          <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              }
                              align="right"
                            >
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    await conversationAPI.markMessagesAsRead(conversationId);
                                    // Wait a bit for backend to update, then refresh
                                    setTimeout(() => {
                                      // Refresh unread status
                                      checkUnreadMessages();
                                      // Notify parent to refresh unread count
                                      onUnreadChange?.();
                                    }, 500);
                                  } catch (err) {
                                    console.error('Failed to mark as read:', err);
                                  }
                                }}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark as read
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    await conversationAPI.markMessagesAsUnread(conversationId);
                                    // Wait a bit for backend to update, then refresh
                                    setTimeout(() => {
                                      // Refresh unread status
                                      checkUnreadMessages();
                                      // Notify parent to refresh unread count
                                      onUnreadChange?.();
                                    }, 500);
                                  } catch (err) {
                                    console.error('Failed to mark as unread:', err);
                                  }
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Mark as unread
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const newPinnedSet = new Set(pinnedAgents);
                                    if (isPinned) {
                                      newPinnedSet.delete(agent.id);
                                    } else {
                                      newPinnedSet.add(agent.id);
                                    }
                                    setPinnedAgents(newPinnedSet);
                                    localStorage.setItem('pinnedAgents', JSON.stringify(Array.from(newPinnedSet)));
                                    // Optionally call backend
                                    await conversationAPI.togglePinConversation(conversationId);
                                  } catch (err) {
                                    console.error('Failed to toggle pin:', err);
                                  }
                                }}
                              >
                                <Pin className="h-4 w-4 mr-2" />
                                {isPinned ? 'Unpin chat' : 'Pin chat'}
                              </DropdownMenuItem>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <>
                    {/* Active Conversations Section */}
                    {agentsWithConversations.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
                          Active Conversations
                        </h3>
                        {[...agentsWithConversations].sort((a, b) => {
                          const aPinned = pinnedAgents.has(a.id);
                          const bPinned = pinnedAgents.has(b.id);
                          if (aPinned && !bPinned) return -1;
                          if (!aPinned && bPinned) return 1;
                          return 0;
                        }).map(agent => renderAgentItem(agent))}
                      </div>
                    )}

                    {/* All AI Agents Section */}
                    {allAgentsList.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
                          All AI Agents
                        </h3>
                        {[...allAgentsList]
                          .filter(agent => !agentsWithConversations.some(ac => ac.id === agent.id))
                          .sort((a, b) => {
                            const aPinned = pinnedAgents.has(a.id);
                            const bPinned = pinnedAgents.has(b.id);
                            if (aPinned && !bPinned) return -1;
                            if (!aPinned && bPinned) return 1;
                            return a.name.localeCompare(b.name);
                          })
                          .map(agent => renderAgentItem(agent))}
                      </div>
                    )}

                    {agentsWithConversations.length === 0 && allAgentsList.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">No agents found</div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }
);
