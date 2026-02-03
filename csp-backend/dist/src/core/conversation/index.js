var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../common/errors.js";
import { conversationDML } from "../../dml/conversation.js";
import { z } from "zod";
const createConversationSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    agentId: z.string().min(1, "Agent ID is required"),
    subject: z.string().optional().nullable(),
});
const createMessageSchema = z.object({
    conversationId: z.string().min(1, "Conversation ID is required"),
    senderType: z.enum(["user", "agent"]),
    content: z.string().min(1, "Message content is required"),
});
export const createConversation = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = createConversationSchema.safeParse(params);
    if (!parsed.success) {
        throw new BadRequestError("Invalid input", parsed.error.message);
    }
    // Check if conversation already exists
    const existing = yield conversationDML.getConversationByUserAndAgent(params.userId, params.agentId);
    if (existing) {
        return existing;
    }
    const newConversation = yield conversationDML.createConversation(parsed.data);
    // Fetch the full conversation with relations
    const fullConversation = yield conversationDML.getConversationById(newConversation.id);
    if (!fullConversation) {
        throw new NotFoundError("Failed to retrieve created conversation");
    }
    return fullConversation;
});
export const getConversation = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[getConversation] Looking up conversation ${id} for user ${userId}`);
    console.log(`[getConversation] userId type: ${typeof userId}, value: ${userId}`);
    const conversation = yield conversationDML.getConversationById(id);
    console.log(`[getConversation] Found conversation:`, conversation ? `userId=${conversation.userId} (type: ${typeof conversation.userId})` : 'null');
    if (!conversation) {
        console.error(`[getConversation] Conversation ${id} not found`);
        throw new NotFoundError("Conversation not found");
    }
    // Convert both to strings for comparison (MongoDB ObjectId might be different type)
    const conversationUserId = String(conversation.userId);
    const requestUserId = String(userId);
    console.log(`[getConversation] Comparing userIds: "${conversationUserId}" === "${requestUserId}"`);
    if (conversationUserId !== requestUserId) {
        console.error(`[getConversation] User mismatch: conversation.userId="${conversationUserId}", requested userId="${requestUserId}"`);
        throw new UnauthorizedError("Unauthorized access to conversation");
    }
    return conversation;
});
export const getConversations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield conversationDML.getConversationsByUserId(userId);
});
export const getOrCreateConversation = (params) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[getOrCreateConversation] Checking for existing conversation: userId=${params.userId}, agentId=${params.agentId}`);
    const existing = yield conversationDML.getConversationByUserAndAgent(params.userId, params.agentId);
    if (existing) {
        console.log(`[getOrCreateConversation] Found existing conversation: ${existing.id}`);
        return existing;
    }
    console.log(`[getOrCreateConversation] Creating new conversation for userId=${params.userId}, agentId=${params.agentId}`);
    // Create new conversation
    const newConversation = yield createConversation(params);
    console.log(`[getOrCreateConversation] Created conversation: ${newConversation.id}`);
    // Return the full conversation with relations
    console.log(`[getOrCreateConversation] Fetching full conversation ${newConversation.id}`);
    const fullConversation = yield conversationDML.getConversationById(newConversation.id);
    if (!fullConversation) {
        console.error(`[getOrCreateConversation] Failed to retrieve created conversation ${newConversation.id}`);
        throw new NotFoundError("Failed to retrieve created conversation");
    }
    console.log(`[getOrCreateConversation] Returning conversation ${fullConversation.id} with userId=${fullConversation.userId}`);
    return fullConversation;
});
export const sendMessage = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = createMessageSchema.safeParse(params);
    if (!parsed.success) {
        throw new BadRequestError("Invalid input", parsed.error.message);
    }
    // Verify conversation exists and user has access
    const conversation = yield conversationDML.getConversationById(params.conversationId);
    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }
    if (conversation.userId !== params.userId && params.senderType === "user") {
        throw new UnauthorizedError("Unauthorized access to conversation");
    }
    // Mark other party's messages as read
    yield conversationDML.markMessagesAsRead(params.conversationId, params.senderType);
    // Save the user's message
    const userMessage = yield conversationDML.createMessage({
        conversationId: params.conversationId,
        senderType: params.senderType,
        content: params.content,
    });
    // If user sent a message, generate and save agent response
    if (params.senderType === "user" && conversation.agent) {
        console.log(`[Conversation] 🤖 User message received, generating AI response...`);
        console.log(`[Conversation] 👤 User: "${params.content.substring(0, 100)}${params.content.length > 100 ? '...' : ''}"`);
        console.log(`[Conversation] 🤖 Agent: ${conversation.agent.name} (ID: ${conversation.agent.id})`);
        try {
            // Get all messages including the one just created
            const allMessages = yield conversationDML.getMessagesByConversationId(params.conversationId);
            console.log(`[Conversation] 📨 Retrieved ${allMessages.length} messages from conversation`);
            // Generate agent response using Gemini
            const { processUserMessage } = yield import("../gemini/index.js");
            const agentResponse = yield processUserMessage(params.content, allMessages, conversation.agent);
            console.log(`[Conversation] 💾 Saving agent response to database...`);
            // Save agent's response
            const savedMessage = yield conversationDML.createMessage({
                conversationId: params.conversationId,
                senderType: "agent",
                content: agentResponse,
                isRead: false,
            });
            console.log(`[Conversation] ✅ Agent response saved successfully (Message ID: ${savedMessage.id})`);
        }
        catch (error) {
            console.error("[Conversation] ❌ Error generating agent response:", error);
            // Don't throw - user message is already saved
            // Optionally, save a fallback message
            try {
                console.log("[Conversation] ⚠️  Saving fallback error message...");
                yield conversationDML.createMessage({
                    conversationId: params.conversationId,
                    senderType: "agent",
                    content: `I apologize, but I'm having trouble processing your message right now. (Error: ${error instanceof Error ? error.message : String(error)}). Please try again.`,
                    isRead: false,
                });
                console.log("[Conversation] ✅ Fallback message saved");
            }
            catch (fallbackError) {
                console.error("[Conversation] ❌ Error saving fallback message:", fallbackError);
            }
        }
    }
    return userMessage;
});
export const getMessages = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversationDML.getConversationById(conversationId);
    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }
    if (conversation.userId !== userId) {
        throw new UnauthorizedError("Unauthorized access to conversation");
    }
    return yield conversationDML.getMessagesByConversationId(conversationId);
});
export const markMessagesAsRead = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversationDML.getConversationById(conversationId);
    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }
    if (conversation.userId !== userId) {
        throw new UnauthorizedError("Unauthorized access to conversation");
    }
    // Mark all agent messages as read
    yield conversationDML.markMessagesAsRead(conversationId, 'user');
});
export const markMessagesAsUnread = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversationDML.getConversationById(conversationId);
    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }
    if (conversation.userId !== userId) {
        throw new UnauthorizedError("Unauthorized access to conversation");
    }
    // Mark all agent messages as unread
    yield conversationDML.markMessagesAsUnread(conversationId, 'user');
});
export const togglePinConversation = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversationDML.getConversationById(conversationId);
    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }
    if (conversation.userId !== userId) {
        throw new UnauthorizedError("Unauthorized access to conversation");
    }
    // Note: Since schema doesn't have isPinned field yet, this is a placeholder
    // The frontend will handle pinning via localStorage for now
    // Return the conversation as-is
    return conversation;
});
export const conversationCore = {
    createConversation,
    getConversation,
    getConversations,
    getOrCreateConversation,
    sendMessage,
    getMessages,
    markMessagesAsRead,
    markMessagesAsUnread,
    togglePinConversation,
};
