import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportChatHistoryToPdf } from '@/lib/historyExport';
import { conversationAPI, type AIAgent, type EmailConversation } from '@/lib/api';
import { Download, Loader2, FileText, AlertCircle } from 'lucide-react';

interface HistoryDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: AIAgent | null;
}

export function HistoryDownloadModal({
    isOpen,
    onClose,
    agent
}: HistoryDownloadModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!agent) return;

        try {
            setIsDownloading(true);

            const response = await conversationAPI.getConversations();
            const conversation = response.conversations.find(c => c.agentId === agent.id);

            let conversationsToExport: EmailConversation[] = [];

            if (conversation) {
                if (!conversation.messages || conversation.messages.length === 0) {
                    const fullConv = await conversationAPI.getConversation(conversation.id);
                    conversationsToExport = [fullConv.conversation];
                } else {
                    conversationsToExport = [conversation];
                }
            }

            if (conversationsToExport.length === 0) {
                alert('No conversation history found for this agent.');
                setIsDownloading(false);
                return;
            }

            // Filename: agent-name-history.pdf
            const filename = `${agent.name.replace(/\s+/g, '-').toLowerCase()}-history`;
            const userEmail = localStorage.getItem('userEmail') || 'User';

            await exportChatHistoryToPdf(conversationsToExport, filename, userEmail);

            onClose();
        } catch (error) {
            console.error('Failed to download history:', error);
            alert('Failed to download chat history. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 text-foreground">
                <div className="flex flex-col space-y-5 text-center">
                    <div className="flex flex-col space-y-2">
                        <h2 className="text-xl font-semibold tracking-tight">Download Chat History</h2>
                        {agent ? (
                            <div className="flex items-center justify-center gap-2 text-muted-foreground bg-secondary/30 py-2 px-3 rounded-full w-fit mx-auto">
                                {agent.avatar ? (
                                    <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-[8px] font-bold">AI</span>
                                    </div>
                                )}
                                <span className="font-medium text-sm text-foreground">{agent.name}</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-500/10 py-2 px-3 rounded-full w-fit mx-auto border border-amber-500/20">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-medium text-xs">No agent selected</span>
                            </div>
                        )}
                    </div>

                    {/* Visual File Preview */}
                    <div className="bg-muted/30 p-8 rounded-xl flex flex-col items-center gap-4 border border-dashed border-muted-foreground/20 relative overflow-hidden group">
                        <div className="relative w-20 h-28 bg-background border rounded-md shadow-sm p-3 flex flex-col gap-2 transition-transform group-hover:scale-105 duration-300">
                            <div className="w-full h-1 bg-muted rounded-full opacity-40" />
                            <div className="w-4/5 h-1 bg-muted rounded-full opacity-40" />
                            <div className="w-full h-1 bg-muted rounded-full opacity-40" />
                            <div className="w-3/4 h-1 bg-muted rounded-full opacity-40" />
                            <div className="w-full h-1 bg-muted rounded-full opacity-40" />
                            <div className="w-2/3 h-1 bg-muted rounded-full opacity-40" />

                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[8px] font-black shadow-md flex items-center gap-1">
                                <FileText className="w-2.5 h-2.5" />
                                PDF
                            </div>
                        </div>
                        {!agent && (
                            <p className="text-xs text-muted-foreground mt-2 max-w-[200px] leading-relaxed">
                                Please open any conversation or chat to download history.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            onClick={handleDownload}
                            disabled={isDownloading || !agent}
                            className="h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-5 w-5" />
                                    Download PDF
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isDownloading}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
