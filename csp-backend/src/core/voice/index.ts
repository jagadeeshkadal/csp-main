import { GoogleGenerativeAI } from "@google/generative-ai";
import Replicate from "replicate";
import { IAIAgent, IEmailMessage } from "../../interfaces/index.js";
import { voiceDML } from "../../dml/voice.js";
import { conversationDML } from "../../dml/conversation.js";
import { prepareConversationContext } from "../gemini/index.js";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️  GEMINI_API_KEY not found. Voice features will not work.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL_NAME = (process.env.GEMINI_MODEL || "gemini-2.0-flash-lite").trim().replace(/^["']|["']$/g, '');

/**
 * Process text message with Gemini and generate voice response
 * Frontend handles speech-to-text, backend only processes text
 */
export const processVoiceText = async (
  userText: string,
  conversationId: string,
  agent: IAIAgent
): Promise<{ agentResponse: string; agentAudioUrl: string | null }> => {
  console.log(`[Voice] 💬 Processing: ${conversationId} | text: ${userText.length} chars`);

  try {
    // Get conversation context (unified email + voice messages)
    const allMessages = await conversationDML.getUnifiedMessagesByConversationId(conversationId);
    console.log(`[Voice] 📚 Context: ${allMessages.length} messages (unified)`);

    // Prepare conversation context using the central summarization logic
    const conversationContext = await prepareConversationContext(allMessages, agent);

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

    let agentResponse: string;
    try {
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      agentResponse = response.text();
      console.log(`[Voice] ✅ Gemini: ${agentResponse.length} chars`);
    } catch (error: any) {
      // Handle rate limit errors
      if (error?.status === 429) {
        const retryDelay = error?.errorDetails?.[2]?.retryDelay || "60s";
        console.error(`[Voice] ❌ Gemini rate limit (429) - retry in ${retryDelay}`);
        throw new Error(`Rate limit exceeded. Please wait ${retryDelay} before trying again.`);
      }
      throw error;
    }

    // Generate audio using Kokoro via Replicate
    const agentAudioUrl = await generateAudioWithKokoro(
      agentResponse,
      agent.voice ?? undefined,
      agent.voiceSpeed ?? undefined
    );

    if (agentAudioUrl) {
      console.log(`[Voice] ✅ Audio: ${agentAudioUrl.substring(0, 60)}...`);
    } else {
      console.warn(`[Voice] ⚠️  No audio URL`);
    }

    return {
      agentResponse,
      agentAudioUrl,
    };
  } catch (error) {
    console.error(`[Voice] ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Generate audio from text using Replicate TTS (default: Orpheus model)
 */
const generateAudioWithKokoro = async (
  text: string,
  voice?: string,
  speed?: number
): Promise<string | null> => {
  try {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      console.warn("[Replicate] ❌ No REPLICATE_API_TOKEN found");
      return null;
    }
    console.log(`[Replicate] 🎵 Calling API (text: ${text.length} chars) | Voice: ${voice || 'default'} | Speed: ${speed || 'default'}`);

    const replicate = new Replicate({ auth: replicateToken });

    const startTime = Date.now();

    // Use model from env or default to Orpheus model
    const modelId = process.env.REPLICATE_TTS_MODEL || "lucataco/orpheus-3b-0.1-ft:79f2a473e6a9720716a473d9b2f2951437dbf91dc02ccb7079fb3d89b881207f";

    // Default voice based on model (Orpheus supports: tara, dan, josh, emma)
    // You can override with REPLICATE_TTS_VOICE env variable
    const defaultVoice = process.env.REPLICATE_TTS_VOICE || "tara";
    const selectedVoice = voice || defaultVoice;

    // Use speed if provided, otherwise default (usually 1.0)
    // Note: Some models might not support speed, but we'll include it in input if provided
    const input: any = {
      text: text,
      voice: selectedVoice
    };

    if (speed) {
      input.speed = speed;
    }

    // Log request body before sending
    const requestBody = {
      model: modelId,
      input: input
    };
    console.log(`[Replicate] 📤 Request body:`, JSON.stringify(requestBody, null, 2));

    const output = await replicate.run(modelId as any, { input });

    console.log("output", output);
    console.log(`[Replicate] 📥 Output type: ${typeof output} | constructor: ${output?.constructor?.name}`);
    console.log(`[Replicate] 📥 Has url method: ${typeof (output as any)?.url === 'function'}`);

    const duration = Date.now() - startTime;
    console.log(`[Replicate] ✅ Response in ${duration}ms | type: ${typeof output} | isArray: ${Array.isArray(output)}`);

    if (!output) {
      console.error(`[Replicate] ❌ Output is null/undefined`);
      return null;
    }

    // Handle ReadableStream/FileOutput with .url() method (Replicate FileOutput interface)
    if (output && typeof output === "object" && typeof (output as any).url === "function") {
      try {
        const urlResult = (output as any).url();
        console.log(`[Replicate] 📥 url() result:`, urlResult);
        console.log(`[Replicate] 📥 url() result type: ${typeof urlResult}`);

        // url() might return a URL object or a string
        let audioUrl: string;
        if (urlResult && typeof urlResult === "object" && "href" in urlResult) {
          // It's a URL object
          audioUrl = (urlResult as URL).toString();
        } else if (typeof urlResult === "string") {
          audioUrl = urlResult;
        } else if (urlResult && typeof urlResult === "object" && "then" in urlResult) {
          // If it's a promise, await it
          const resolved = await urlResult;
          audioUrl = resolved && typeof resolved === "object" && "href" in resolved
            ? (resolved as URL).toString()
            : String(resolved);
        } else {
          audioUrl = String(urlResult);
        }

        const audioUrlString: string = typeof audioUrl === "string" ? audioUrl : String(audioUrl);
        console.log(`[Replicate] ✅ URL from FileOutput: ${audioUrlString?.substring(0, 80)}...`);
        if (audioUrlString && typeof audioUrlString === "string" && (audioUrlString.startsWith('http://') || audioUrlString.startsWith('https://'))) {
          return audioUrlString;
        }
      } catch (urlError) {
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
      if (firstOutput && typeof firstOutput === "object" && typeof (firstOutput as any).url === "function") {
        try {
          const urlResult = (firstOutput as any).url();
          let audioUrl: string;
          if (urlResult && typeof urlResult === "object" && "href" in urlResult) {
            audioUrl = urlResult.toString();
          } else if (typeof urlResult === "string") {
            audioUrl = urlResult;
          } else if (urlResult && typeof urlResult === "object" && "then" in urlResult) {
            const resolved = await urlResult;
            audioUrl = resolved && typeof resolved === "object" && "href" in resolved ? resolved.toString() : String(resolved);
          } else {
            audioUrl = String(urlResult);
          }
          if (audioUrl && typeof audioUrl === "string" && (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'))) {
            console.log(`[Replicate] ✅ URL from array item: ${audioUrl.substring(0, 60)}...`);
            return audioUrl;
          }
        } catch (urlError) {
          console.error(`[Replicate] ❌ Error calling url() on array item:`, urlError);
        }
      }
    }

    // Handle direct URL string
    if (typeof output === "string") {
      const outputStr = output as string;
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
  } catch (error) {
    console.error(`[Replicate] ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error && typeof error === 'object' && 'status' in error) {
      console.error(`[Replicate] ❌ Status: ${(error as any).status}`);
    }
    return null;
  }
};

/**
 * Save voice exchange to database
 */
export const saveVoiceExchange = async (
  conversationId: string,
  userTranscript: string,
  agentResponse: string,
  agentAudioUrl: string | null
): Promise<any> => {
  const exchange = await voiceDML.createVoiceExchange({
    conversationId,
    userAudioUrl: null,
    userTranscript: userTranscript,
    agentResponse,
    agentAudioUrl,
  });

  console.log(`[Voice] 💾 Saved: ${exchange.id} | audio: ${agentAudioUrl ? 'yes' : 'no'}`);
  return exchange;
};
