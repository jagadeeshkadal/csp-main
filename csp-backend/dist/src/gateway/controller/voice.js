var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BaseError } from "../../common/errors.js";
import { verifyToken } from "../../core/auth/hydrator.js";
import { conversationDML } from "../../dml/conversation.js";
import { voiceDML } from "../../dml/voice.js";
import { processVoiceText, saveVoiceExchange } from "../../core/voice/index.js";
const getUserIdFromRequest = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        throw new Error("No token provided");
    }
    const decoded = yield verifyToken(token);
    return String(decoded.userId);
});
/**
 * Process voice text and get agent response
 * Frontend handles speech-to-text, we only receive text
 */
const processVoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // conversationId
        const userId = yield getUserIdFromRequest(req);
        const { text } = req.body; // User's transcribed text
        console.log(`[Voice Controller] 💬 Processing voice text for conversation: ${id}`);
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ message: "Text is required" });
        }
        // Verify conversation exists and user has access
        const conversation = yield conversationDML.getConversationById(id);
        if (!conversation) {
            console.error(`[Voice Controller] ❌ Conversation ${id} not found`);
            return res.status(404).json({ message: "Conversation not found" });
        }
        console.log(`[Voice Controller] ✅ Conversation found: userId=${conversation.userId}, agentId=${conversation.agentId}`);
        if (String(conversation.userId) !== String(userId)) {
            console.error(`[Voice Controller] ❌ User mismatch: conversation.userId=${conversation.userId}, request.userId=${userId}`);
            return res.status(403).json({ message: "Unauthorized access to conversation" });
        }
        // Fetch agent separately if not included
        let agent = conversation.agent;
        if (!agent && conversation.agentId) {
            console.log(`[Voice Controller] ⚠️ Agent not included in conversation, fetching separately...`);
            const { agentDML } = yield import("../../dml/agent.js");
            const fetchResult = yield agentDML.getAgentById(conversation.agentId);
            agent = fetchResult || undefined;
        }
        if (!agent) {
            console.error(`[Voice Controller] ❌ Agent not found for conversation ${id}, agentId=${conversation.agentId}`);
            return res.status(400).json({ message: "Agent not found for conversation" });
        }
        console.log(`[Voice Controller] 📝 User text: "${text.substring(0, 100)}..."`);
        // Process text with Gemini and generate audio
        const { agentResponse, agentAudioUrl } = yield processVoiceText(text.trim(), id, agent);
        // Save voice exchange to database
        const exchange = yield saveVoiceExchange(id, text.trim(), agentResponse, agentAudioUrl);
        console.log(`[Voice Controller] ✅ Voice exchange completed: ${exchange.id}`);
        res.status(200).json({
            exchange: {
                id: exchange.id,
                userTranscript: text.trim(),
                agentResponse,
                agentAudioUrl,
                createdAt: exchange.createdAt,
            },
        });
    }
    catch (e) {
        console.error("[Voice Controller] ❌ Error:", e);
        console.error("[Voice Controller] ❌ Error stack:", e instanceof Error ? e.stack : "No stack trace");
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            const errorMessage = e instanceof Error ? e.message : String(e);
            res.status(500).json({
                message: "Internal server error",
                error: errorMessage,
                details: e instanceof Error ? e.stack : undefined
            });
        }
    }
});
/**
 * Get all voice exchanges for a conversation
 */
const getVoiceExchanges = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // conversationId
        const userId = yield getUserIdFromRequest(req);
        // Verify conversation exists and user has access
        const conversation = yield conversationDML.getConversationById(id);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        if (conversation.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized access to conversation" });
        }
        const exchanges = yield voiceDML.getVoiceExchangesByConversationId(id);
        res.status(200).json({ exchanges });
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
    processVoice,
    getVoiceExchanges,
};
