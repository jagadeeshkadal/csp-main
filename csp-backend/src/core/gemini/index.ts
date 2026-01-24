import { GoogleGenerativeAI } from "@google/generative-ai";
import { IEmailMessage, IAIAgent } from "../../interfaces";

// Configuration
const MAX_RECENT_MESSAGES = 10; // Keep last 10 messages as-is
const MAX_CONTEXT_LENGTH = 30000; // Approximate token limit for context
// Model name - using gemini-2.5-flash-lite as default
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-09-2025"; // Gemini 2.5 Flash Preview

// Initialize Gemini with API key
// Note: You can get the API key from either:
// 1. Google AI Studio (free tier): https://aistudio.google.com/app/apikey
// 2. Firebase Console (if using same project): Project Settings > Service Accounts
// Both use the same Google Generative AI SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️  GEMINI_API_KEY not found in environment variables. Gemini features will not work.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Summarize older messages in a conversation
 */
const summarizeMessages = async (
  messages: IEmailMessage[],
  agentName: string
): Promise<string> => {
  if (messages.length === 0) return "";

  console.log(`[Gemini] 📝 Summarizing ${messages.length} older messages for agent: ${agentName}`);

  // Format messages for summarization
  const conversationText = messages
    .map((msg) => {
      const sender = msg.senderType === "user" ? "User" : agentName;
      return `${sender}: ${msg.content}`;
    })
    .join("\n\n");

  if (!genAI) {
    throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your .env file");
  }
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `Please provide a concise summary of the following conversation between a user and ${agentName}. 
Focus on key topics discussed, decisions made, and important context. Keep it brief but informative.

Conversation:
${conversationText}

Summary:`;

  try {
    console.log(`[Gemini] 🤖 Calling Gemini API to summarize conversation (model: ${MODEL_NAME})`);
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();
    const duration = Date.now() - startTime;
    console.log(`[Gemini] ✅ Summary generated in ${duration}ms (${summary.length} characters)`);
    return summary;
  } catch (error) {
    console.error("[Gemini] ❌ Error summarizing messages:", error);
    // Fallback: return a simple summary
    const fallback = `Previous conversation with ${messages.length} messages about various topics.`;
    console.log(`[Gemini] ⚠️  Using fallback summary: ${fallback}`);
    return fallback;
  }
};

/**
 * Prepare conversation context for Gemini
 * - If conversation is long, summarize older messages
 * - Keep recent messages as-is
 */
export const prepareConversationContext = async (
  messages: IEmailMessage[],
  agent: IAIAgent
): Promise<string> => {
  console.log(`[Gemini] 📚 Preparing conversation context: ${messages.length} total messages`);
  
  if (messages.length === 0) {
    console.log("[Gemini] ℹ️  No messages in conversation, returning empty context");
    return "";
  }

  // If we have fewer messages than the threshold, return all as-is
  if (messages.length <= MAX_RECENT_MESSAGES) {
    console.log(`[Gemini] ℹ️  Conversation has ${messages.length} messages (≤${MAX_RECENT_MESSAGES}), using all messages as-is`);
    return messages
      .map((msg) => {
        const sender = msg.senderType === "user" ? "User" : agent.name;
        return `${sender}: ${msg.content}`;
      })
      .join("\n\n");
  }

  // Split messages into older (to summarize) and recent (to keep)
  const olderMessages = messages.slice(0, messages.length - MAX_RECENT_MESSAGES);
  const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);

  console.log(`[Gemini] 📊 Splitting conversation: ${olderMessages.length} older messages (will summarize) + ${recentMessages.length} recent messages (keep as-is)`);

  // Summarize older messages
  const summary = await summarizeMessages(olderMessages, agent.name);

  // Format recent messages
  const recentContext = recentMessages
    .map((msg) => {
      const sender = msg.senderType === "user" ? "User" : agent.name;
      return `${sender}: ${msg.content}`;
    })
    .join("\n\n");

  // Combine summary and recent messages
  const fullContext = `[Previous conversation summary]\n${summary}\n\n[Recent conversation]\n${recentContext}`;
  console.log(`[Gemini] ✅ Context prepared: ${fullContext.length} characters total`);
  return fullContext;
};

/**
 * Generate agent response using Gemini
 */
export const generateAgentResponse = async (
  userMessage: string,
  conversationContext: string,
  agent: IAIAgent
): Promise<string> => {
  console.log(`[Gemini] 🚀 Starting agent response generation for: ${agent.name}`);
  console.log(`[Gemini] 👤 User message: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}"`);
  
  if (!genAI) {
    throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your .env file");
  }
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Build system prompt from agent's systemPrompt or default
  const systemPrompt =
    agent.systemPrompt ||
    `You are ${agent.name}, ${agent.description || "a helpful AI assistant"}. 
Respond naturally and helpfully to the user's messages. Keep responses concise and relevant.`;

  console.log(`[Gemini] 📋 System prompt: "${systemPrompt.substring(0, 100)}${systemPrompt.length > 100 ? '...' : ''}"`);
  console.log(`[Gemini] 📝 Context length: ${conversationContext.length} characters`);

  // Build the full prompt
  const fullPrompt = `${systemPrompt}

${conversationContext ? `Conversation history:\n${conversationContext}\n\n` : ""}User: ${userMessage}

${agent.name}:`;

  console.log(`[Gemini] 📤 Sending request to Gemini API (model: ${MODEL_NAME}, prompt length: ${fullPrompt.length} characters)`);
  
  try {
    const startTime = Date.now();
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const agentResponse = response.text();
    const duration = Date.now() - startTime;
    
    console.log(`[Gemini] ✅ Response received in ${duration}ms`);
    console.log(`[Gemini] 💬 Agent response (${agentResponse.length} characters): "${agentResponse.substring(0, 200)}${agentResponse.length > 200 ? '...' : ''}"`);
    
    return agentResponse;
  } catch (error: any) {
    console.error("[Gemini] ❌ Error generating agent response:", error);
    console.error("[Gemini] ❌ Error details:", {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      errorDetails: error.errorDetails
    });
    throw new Error("Failed to generate agent response");
  }
};

/**
 * Process user message and generate agent response
 */
export const processUserMessage = async (
  userMessage: string,
  allMessages: IEmailMessage[],
  agent: IAIAgent
): Promise<string> => {
  console.log(`[Gemini] ========================================`);
  console.log(`[Gemini] 🎯 Processing user message for agent: ${agent.name}`);
  console.log(`[Gemini] 📊 Total messages in conversation: ${allMessages.length}`);
  
  // Prepare conversation context (with summarization if needed)
  const context = await prepareConversationContext(allMessages, agent);

  // Generate agent response
  const agentResponse = await generateAgentResponse(userMessage, context, agent);

  console.log(`[Gemini] ✅ Successfully generated response for ${agent.name}`);
  console.log(`[Gemini] ========================================`);
  
  return agentResponse;
};
