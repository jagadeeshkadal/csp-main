import { GoogleGenerativeAI } from "@google/generative-ai";
import { IEmailMessage, IAIAgent } from "../../interfaces/index.js";

// Configuration
const MAX_RECENT_MESSAGES = 10; // Keep last 10 messages as-is
const MAX_CONTEXT_LENGTH = 30000; // Approximate token limit for context

// Model name - gemini-1.5-flash is robust and fast.
const getSafeEnv = (name: string, fallback: string = "") => {
  return (process.env[name] || fallback).trim().replace(/^["']|["']$/g, '');
};

// Model name - gemini-1.5-flash is robust and fast.
const MODEL_NAME = getSafeEnv("GEMINI_MODEL", "gemini-1.5-flash");

/**
 * Function to get active model and SDK instance
 * Initialized lazily to ensure environment variables are fresh.
 */
const getGenAI = () => {
  const apiKey = getSafeEnv("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in Vercel settings.");
  }

  // Log masked API key for user to verify in Vercel logs
  const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  console.log(`[Gemini] 🔑 Initializing with key: ${maskedKey}`);
  console.log(`[Gemini] 🏷️  Active model: ${MODEL_NAME}`);

  return new GoogleGenerativeAI(apiKey);
};

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

  const genAI = getGenAI();
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
 */
export const prepareConversationContext = async (
  messages: IEmailMessage[],
  agent: IAIAgent
): Promise<string> => {
  console.log(`[Gemini] 📚 Preparing conversation context: ${messages.length} total messages`);

  if (messages.length === 0) {
    return "";
  }

  if (messages.length <= MAX_RECENT_MESSAGES) {
    return messages
      .map((msg) => {
        const sender = msg.senderType === "user" ? "User" : agent.name;
        return `${sender}: ${msg.content}`;
      })
      .join("\n\n");
  }

  const olderMessages = messages.slice(0, messages.length - MAX_RECENT_MESSAGES);
  const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);

  const summary = await summarizeMessages(olderMessages, agent.name);

  const recentContext = recentMessages
    .map((msg) => {
      const sender = msg.senderType === "user" ? "User" : agent.name;
      return `${sender}: ${msg.content}`;
    })
    .join("\n\n");

  return `[Previous conversation summary]\n${summary}\n\n[Recent conversation]\n${recentContext}`;
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

  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const systemPrompt =
    agent.systemPrompt ||
    `You are ${agent.name}, ${agent.description || "a helpful AI assistant"}. 
Respond naturally and helpfully to the user's messages. Keep responses concise and relevant.`;

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
    return agentResponse;
  } catch (error: any) {
    console.error("[Gemini] ❌ Error details:", {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      errorDetails: JSON.stringify(error.errorDetails),
      stack: error.stack
    });
    // Help user identify if they are using the wrong API version
    if (error.message?.includes("404")) {
      throw new Error(`Gemini model '${MODEL_NAME}' not found or your API Key is restricted. Please check AI Studio permissions.`);
    }
    throw new Error(`Gemini failed: ${error.message || 'Unknown error'}`);
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
  console.log(`[Gemini] 🎯 Processing user message for agent: ${agent.name}`);

  const context = await prepareConversationContext(allMessages, agent);
  const agentResponse = await generateAgentResponse(userMessage, context, agent);

  return agentResponse;
};
