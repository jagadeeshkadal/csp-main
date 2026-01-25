import express, { Request, Response } from "express";
import authController from "./controller/auth.js";
import agentController from "./controller/agent.js";
import conversationController from "./controller/conversation.js";
import voiceController from "./controller/voice.js";

const router = express.Router();

// Debug: Log that routes file is loading
console.log("🔵 Routes file loading...");
console.log("🔵 agentController:", agentController ? "✅ loaded" : "❌ not loaded");
console.log("🔵 conversationController:", conversationController ? "✅ loaded" : "❌ not loaded");
console.log("🔵 voiceController:", voiceController ? "✅ loaded" : "❌ not loaded");

// Debug route to test if routes are working
router.get("/test", (req: Request, res: Response) => {
  console.log("Health check hit!");
  res.json({ status: "ok", message: "API is reachable!", timestamp: new Date() });
});

// Debug route to test Gemini API directly
router.get("/test/gemini", async (req: Request, res: Response) => {
  console.log("Gemini Health check hit!");
  const key = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, '');
  const modelToTest = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${key}`;

  try {
    const pingResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
    });
    const pingData = await pingResponse.json();

    res.json({
      status: pingResponse.ok ? "ok" : "fail",
      model: modelToTest,
      response: pingResponse.ok ? (pingData.candidates?.[0]?.content?.parts?.[0]?.text || "success") : "error",
      error: pingResponse.ok ? null : pingData
    });
  } catch (globalError: any) {
    res.status(500).json({ status: "error", message: globalError.message });
  }
});

// Auth routes
router.post("/sso-signup", authController.ssoSignup);
router.post("/sign-in", authController.signIn);

// GET /getUserData route
router.get("/getUserData", (req: Request, res: Response) => {
  console.log("getUserData route hit!");
  console.log("Auth header:", req.headers.authorization);
  return authController.getCurrentUser(req, res);
});

// Agent routes - must be before catch-all
router.get("/agents", async (req: Request, res: Response) => {
  console.log("✅ GET /agents route handler called!");
  console.log("agentController:", agentController);
  if (!agentController || !agentController.getAllAgents) {
    console.error("❌ agentController.getAllAgents is not available!");
    return res.status(500).json({ message: "Agent controller not available" });
  }
  try {
    await agentController.getAllAgents(req, res);
  } catch (error) {
    console.error("❌ Error in /agents route:", error);
    res.status(500).json({ message: "Internal server error", error: String(error) });
  }
});
router.get("/agents/search", agentController.searchAgents);
router.get("/agents/:id", agentController.getAgent);
router.post("/agents", agentController.createAgent);
router.put("/agents/:id", agentController.updateAgent);
router.delete("/agents/:id", agentController.deleteAgent);

// Conversation routes
router.get("/conversations", conversationController.getConversations);
router.post("/conversations", conversationController.createOrGetConversation);

// Voice routes - MUST be before /conversations/:id to avoid route conflicts
// Express matches routes in order, so more specific routes must come first
router.post("/conversations/:id/voice", async (req: Request, res: Response) => {
  console.log("✅ POST /conversations/:id/voice route handler called!");
  console.log("voiceController:", voiceController);
  if (!voiceController || !voiceController.processVoice) {
    console.error("❌ voiceController.processVoice is not available!");
    return res.status(500).json({ message: "Voice controller not available" });
  }
  try {
    await voiceController.processVoice(req, res);
  } catch (error) {
    console.error("❌ Error in /conversations/:id/voice route:", error);
    res.status(500).json({ message: "Internal server error", error: String(error) });
  }
});
router.get("/conversations/:id/voice", async (req: Request, res: Response) => {
  console.log("✅ GET /conversations/:id/voice route handler called!");
  if (!voiceController || !voiceController.getVoiceExchanges) {
    console.error("❌ voiceController.getVoiceExchanges is not available!");
    return res.status(500).json({ message: "Voice controller not available" });
  }
  try {
    await voiceController.getVoiceExchanges(req, res);
  } catch (error) {
    console.error("❌ Error in GET /conversations/:id/voice route:", error);
    res.status(500).json({ message: "Internal server error", error: String(error) });
  }
});

// More specific conversation routes (must come after voice routes)
router.get("/conversations/:id/messages", conversationController.getMessages);
router.post("/conversations/:id/messages", conversationController.sendMessage);
router.post("/conversations/:id/messages/read", conversationController.markMessagesAsRead);
router.post("/conversations/:id/messages/unread", conversationController.markMessagesAsUnread);
router.post("/conversations/:id/pin", conversationController.togglePinConversation);

// Generic conversation route (must come last to avoid matching voice routes)
router.get("/conversations/:id", conversationController.getConversation);

// Catch-all for debugging (must be last)
router.all("*", (req: Request, res: Response) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});




export default router;