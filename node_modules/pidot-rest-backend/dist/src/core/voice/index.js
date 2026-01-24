var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GoogleGenerativeAI } from "@google/generative-ai";
import Replicate from "replicate";
import { voiceDML } from "../../dml/voice";
import { conversationDML } from "../../dml/conversation";
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️  GEMINI_API_KEY not found. Voice features will not work.");
}
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-09-2025";
/**
 * Process text message with Gemini and generate voice response
 * Frontend handles speech-to-text, backend only processes text
 */
export const processVoiceText = (userText, conversationId, agent) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log(`[Voice] 💬 Processing: ${conversationId} | text: ${userText.length} chars`);
    try {
        // Get conversation context (email messages)
        const allMessages = yield conversationDML.getMessagesByConversationId(conversationId);
        console.log(`[Voice] 📚 Context: ${allMessages.length} messages`);
        // Prepare conversation context
        const conversationContext = allMessages
            .map((msg) => {
            const sender = msg.senderType === "user" ? "User" : agent.name;
            return `${sender}: ${msg.content}`;
        })
            .join("\n\n");
        // Build system prompt for voice conversation
        const systemPrompt = `You are ${agent.name}, ${agent.description || "a helpful AI assistant"}. 
You are having a voice conversation with the user. The user will speak to you, and you should respond naturally and conversationally.
Keep your responses concise and clear for voice communication. Be friendly and engaging.

${conversationContext ? `Previous conversation context:\n${conversationContext}\n\n` : ""}`;
        if (!genAI) {
            throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your .env file");
        }
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        // Build the full prompt
        const fullPrompt = `${systemPrompt}User: ${userText}

${agent.name}:`;
        console.log(`[Voice] 📤 Gemini: ${MODEL_NAME}`);
        let agentResponse;
        try {
            const result = yield model.generateContent(fullPrompt);
            const response = result.response;
            agentResponse = response.text();
            console.log(`[Voice] ✅ Gemini: ${agentResponse.length} chars`);
        }
        catch (error) {
            // Handle rate limit errors
            if ((error === null || error === void 0 ? void 0 : error.status) === 429) {
                const retryDelay = ((_b = (_a = error === null || error === void 0 ? void 0 : error.errorDetails) === null || _a === void 0 ? void 0 : _a[2]) === null || _b === void 0 ? void 0 : _b.retryDelay) || "60s";
                console.error(`[Voice] ❌ Gemini rate limit (429) - retry in ${retryDelay}`);
                throw new Error(`Rate limit exceeded. Please wait ${retryDelay} before trying again.`);
            }
            throw error;
        }
        // Generate audio using Kokoro via Replicate
        const agentAudioUrl = yield generateAudioWithKokoro(agentResponse);
        if (agentAudioUrl) {
            console.log(`[Voice] ✅ Audio: ${agentAudioUrl.substring(0, 60)}...`);
        }
        else {
            console.warn(`[Voice] ⚠️  No audio URL`);
        }
        return {
            agentResponse,
            agentAudioUrl,
        };
    }
    catch (error) {
        console.error(`[Voice] ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
});
/**
 * Generate audio from text using Replicate TTS (default: Orpheus model)
 */
const generateAudioWithKokoro = (text) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (!replicateToken) {
            console.warn("[Replicate] ❌ No REPLICATE_API_TOKEN found");
            return null;
        }
        console.log(`[Replicate] 🎵 Calling API (text: ${text.length} chars)...`);
        const replicate = new Replicate({ auth: replicateToken });
        const startTime = Date.now();
        // Use model from env or default to Orpheus model
        const modelId = process.env.REPLICATE_TTS_MODEL || "lucataco/orpheus-3b-0.1-ft:79f2a473e6a9720716a473d9b2f2951437dbf91dc02ccb7079fb3d89b881207f";
        // Default voice based on model (Orpheus supports: tara, dan, josh, emma)
        // You can override with REPLICATE_TTS_VOICE env variable
        const defaultVoice = process.env.REPLICATE_TTS_VOICE || "tara";
        const input = {
            text: text,
            voice: defaultVoice
        };
        // Log request body before sending
        const requestBody = {
            model: modelId,
            input: input
        };
        console.log(`[Replicate] 📤 Request body:`, JSON.stringify(requestBody, null, 2));
        const output = yield replicate.run(modelId, { input });
        console.log("output", output);
        console.log(`[Replicate] 📥 Output type: ${typeof output} | constructor: ${(_a = output === null || output === void 0 ? void 0 : output.constructor) === null || _a === void 0 ? void 0 : _a.name}`);
        console.log(`[Replicate] 📥 Has url method: ${typeof (output === null || output === void 0 ? void 0 : output.url) === 'function'}`);
        const duration = Date.now() - startTime;
        console.log(`[Replicate] ✅ Response in ${duration}ms | type: ${typeof output} | isArray: ${Array.isArray(output)}`);
        if (!output) {
            console.error(`[Replicate] ❌ Output is null/undefined`);
            return null;
        }
        // Handle ReadableStream/FileOutput with .url() method (Replicate FileOutput interface)
        if (output && typeof output === "object" && typeof output.url === "function") {
            try {
                const urlResult = output.url();
                console.log(`[Replicate] 📥 url() result:`, urlResult);
                console.log(`[Replicate] 📥 url() result type: ${typeof urlResult}`);
                // url() might return a URL object or a string
                let audioUrl;
                if (urlResult && typeof urlResult === "object" && "href" in urlResult) {
                    // It's a URL object
                    audioUrl = urlResult.toString();
                }
                else if (typeof urlResult === "string") {
                    audioUrl = urlResult;
                }
                else if (urlResult && typeof urlResult === "object" && "then" in urlResult) {
                    // If it's a promise, await it
                    const resolved = yield urlResult;
                    audioUrl = resolved && typeof resolved === "object" && "href" in resolved
                        ? resolved.toString()
                        : String(resolved);
                }
                else {
                    audioUrl = String(urlResult);
                }
                const audioUrlString = typeof audioUrl === "string" ? audioUrl : String(audioUrl);
                console.log(`[Replicate] ✅ URL from FileOutput: ${audioUrlString === null || audioUrlString === void 0 ? void 0 : audioUrlString.substring(0, 80)}...`);
                if (audioUrlString && typeof audioUrlString === "string" && (audioUrlString.startsWith('http://') || audioUrlString.startsWith('https://'))) {
                    return audioUrlString;
                }
            }
            catch (urlError) {
                console.error(`[Replicate] ❌ Error calling url():`, urlError);
            }
        }
        // Handle array output (like in the example: output[0])
        if (Array.isArray(output) && output.length > 0) {
            const firstOutput = output[0];
            console.log(`[Replicate] 📦 Array output (length: ${output.length}) | first item type: ${typeof firstOutput}`);
            // If first item is a URL string
            if (typeof firstOutput === "string" && (firstOutput.startsWith('http://') || firstOutput.startsWith('https://'))) {
                console.log(`[Replicate] ✅ URL from array: ${firstOutput.substring(0, 60)}...`);
                return firstOutput;
            }
            // If first item has a url() method
            if (firstOutput && typeof firstOutput === "object" && typeof firstOutput.url === "function") {
                try {
                    const urlResult = firstOutput.url();
                    let audioUrl;
                    if (urlResult && typeof urlResult === "object" && "href" in urlResult) {
                        audioUrl = urlResult.toString();
                    }
                    else if (typeof urlResult === "string") {
                        audioUrl = urlResult;
                    }
                    else if (urlResult && typeof urlResult === "object" && "then" in urlResult) {
                        const resolved = yield urlResult;
                        audioUrl = resolved && typeof resolved === "object" && "href" in resolved ? resolved.toString() : String(resolved);
                    }
                    else {
                        audioUrl = String(urlResult);
                    }
                    if (audioUrl && typeof audioUrl === "string" && (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'))) {
                        console.log(`[Replicate] ✅ URL from array item: ${audioUrl.substring(0, 60)}...`);
                        return audioUrl;
                    }
                }
                catch (urlError) {
                    console.error(`[Replicate] ❌ Error calling url() on array item:`, urlError);
                }
            }
        }
        // Handle direct URL string
        if (typeof output === "string") {
            const outputStr = output;
            if (outputStr.startsWith('http://') || outputStr.startsWith('https://')) {
                console.log(`[Replicate] ✅ URL (string): ${outputStr.substring(0, 60)}...`);
                return outputStr;
            }
        }
        // Log detailed output info for debugging
        console.warn(`[Replicate] ⚠️  Unexpected output format`);
        console.warn(`[Replicate] ⚠️  Type: ${typeof output} | IsArray: ${Array.isArray(output)}`);
        if (typeof output === "object" && output !== null) {
            console.warn(`[Replicate] ⚠️  Keys: ${Object.keys(output).join(', ')}`);
            if (Array.isArray(output)) {
                console.warn(`[Replicate] ⚠️  Array length: ${output.length}`);
            }
        }
        return null;
    }
    catch (error) {
        console.error(`[Replicate] ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        if (error && typeof error === 'object' && 'status' in error) {
            console.error(`[Replicate] ❌ Status: ${error.status}`);
        }
        return null;
    }
});
/**
 * Save voice exchange to database
 */
export const saveVoiceExchange = (conversationId, userTranscript, agentResponse, agentAudioUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const exchange = yield voiceDML.createVoiceExchange({
        conversationId,
        userAudioUrl: null,
        userTranscript: userTranscript,
        agentResponse,
        agentAudioUrl,
    });
    console.log(`[Voice] 💾 Saved: ${exchange.id} | audio: ${agentAudioUrl ? 'yes' : 'no'}`);
    return exchange;
});
