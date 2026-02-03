var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { conversationCore } from "../../core/conversation/index.js";
import { BaseError } from "../../common/errors.js";
import { verifyToken } from "../../core/auth/hydrator.js";
const getUserIdFromRequest = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        throw new Error("No token provided");
    }
    const decoded = yield verifyToken(token);
    const userId = decoded.userId;
    console.log(`[getUserIdFromRequest] Extracted userId from token: ${userId} (type: ${typeof userId})`);
    return String(userId); // Ensure it's a string for MongoDB comparison
});
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield getUserIdFromRequest(req);
        const conversations = yield conversationCore.getConversations(userId);
        res.status(200).json({ conversations });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const getConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        console.log(`[getConversation controller] Requested conversation ID: ${id}`);
        const userId = yield getUserIdFromRequest(req);
        console.log(`[getConversation controller] User ID from token: ${userId}`);
        const conversation = yield conversationCore.getConversation(id, userId);
        res.status(200).json({ conversation });
    }
    catch (e) {
        console.error(`[getConversation controller] Error:`, e);
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const createOrGetConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield getUserIdFromRequest(req);
        console.log(`[createOrGetConversation] User ID: ${userId}`);
        const { agentId, subject } = req.body;
        console.log(`[createOrGetConversation] Agent ID: ${agentId}, Subject: ${subject}`);
        const conversation = yield conversationCore.getOrCreateConversation({
            userId,
            agentId,
            subject,
        });
        console.log(`[createOrGetConversation] Created/retrieved conversation: ${conversation.id} for user ${conversation.userId}`);
        res.status(200).json({ conversation });
    }
    catch (e) {
        console.error(`[createOrGetConversation] Error:`, e);
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = yield getUserIdFromRequest(req);
        const messages = yield conversationCore.getMessages(id, userId);
        res.status(200).json({ messages });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = yield getUserIdFromRequest(req);
        const message = yield conversationCore.sendMessage({
            conversationId: id,
            senderType: "user",
            content,
            userId,
        });
        res.status(201).json({ message });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const markMessagesAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = yield getUserIdFromRequest(req);
        yield conversationCore.markMessagesAsRead(id, userId);
        res.status(200).json({ success: true });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const markMessagesAsUnread = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = yield getUserIdFromRequest(req);
        yield conversationCore.markMessagesAsUnread(id, userId);
        res.status(200).json({ success: true });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const togglePinConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = yield getUserIdFromRequest(req);
        const conversation = yield conversationCore.togglePinConversation(id, userId);
        res.status(200).json({ conversation });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
export default {
    getConversations,
    getConversation,
    createOrGetConversation,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    markMessagesAsUnread,
    togglePinConversation,
};
