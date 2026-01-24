var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import prisma from "../db/prisma";
// Conversation DMLs
const createConversation = (conversation) => __awaiter(void 0, void 0, void 0, function* () {
    const newConversation = yield prisma.emailConversation.create({
        data: Object.assign(Object.assign({}, conversation), { deletedAt: null }),
        include: {
            agent: true,
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    return newConversation;
});
const getConversationById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[getConversationById] Looking up conversation with ID: ${id}`);
    try {
        const conversation = yield prisma.emailConversation.findFirst({
            where: { id, deletedAt: null },
            include: {
                agent: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        console.log(`[getConversationById] Query result:`, conversation ? `Found conversation with userId=${conversation.userId}` : 'null');
        // Also try without deletedAt filter to see if conversation exists at all
        if (!conversation) {
            const anyConversation = yield prisma.emailConversation.findFirst({
                where: { id },
            });
            console.log(`[getConversationById] Conversation exists without deletedAt filter:`, anyConversation ? `deletedAt=${anyConversation.deletedAt}` : 'null');
        }
        return conversation;
    }
    catch (error) {
        console.error(`[getConversationById] Error querying conversation:`, error);
        throw error;
    }
});
const getConversationsByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversations = yield prisma.emailConversation.findMany({
        where: { userId, deletedAt: null },
        include: {
            agent: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                // Get all messages to check for unread status
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
    return conversations;
});
const getConversationByUserAndAgent = (userId, agentId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield prisma.emailConversation.findFirst({
        where: { userId, agentId, deletedAt: null },
        include: {
            agent: true,
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    return conversation;
});
const updateConversation = (id, conversation) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedConversation = yield prisma.emailConversation.update({
        where: { id },
        data: conversation,
    });
    return updatedConversation;
});
const deleteConversation = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deletedConversation = yield prisma.emailConversation.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
    });
    return deletedConversation;
});
// Message DMLs
const createMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const newMessage = yield prisma.emailMessage.create({
        data: Object.assign(Object.assign({}, message), { isRead: (_a = message.isRead) !== null && _a !== void 0 ? _a : false }),
    });
    // Update conversation's updatedAt timestamp
    yield prisma.emailConversation.update({
        where: { id: message.conversationId },
        data: { updatedAt: new Date() },
    });
    return newMessage;
});
const getMessageById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield prisma.emailMessage.findUnique({
        where: { id },
    });
    return message;
});
const getMessagesByConversationId = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield prisma.emailMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
    });
    return messages;
});
const updateMessage = (id, message) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedMessage = yield prisma.emailMessage.update({
        where: { id },
        data: message,
    });
    return updatedMessage;
});
const markMessagesAsRead = (conversationId, senderType) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.emailMessage.updateMany({
        where: {
            conversationId,
            senderType: senderType === 'user' ? 'agent' : 'user',
            isRead: false,
        },
        data: { isRead: true },
    });
});
const markMessagesAsUnread = (conversationId, senderType) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.emailMessage.updateMany({
        where: {
            conversationId,
            senderType: senderType === 'user' ? 'agent' : 'user',
            isRead: true,
        },
        data: { isRead: false },
    });
});
export const conversationDML = {
    createConversation,
    getConversationById,
    getConversationsByUserId,
    getConversationByUserAndAgent,
    updateConversation,
    deleteConversation,
    createMessage,
    getMessageById,
    getMessagesByConversationId,
    updateMessage,
    markMessagesAsRead,
    markMessagesAsUnread,
};
