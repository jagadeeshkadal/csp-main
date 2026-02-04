import { Request, Response } from "express";
import { conversationCore } from "../../core/conversation/index.js";
import { BaseError } from "../../common/errors.js";
import { verifyToken } from "../../core/auth/hydrator.js";

const getUserIdFromRequest = async (req: Request): Promise<string> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && typeof authHeader === 'string' ? authHeader.split(" ")[1] : undefined;
  if (!token) {
    throw new Error("No token provided");
  }
  const decoded = await verifyToken(token);
  const userId = (decoded as any).userId;
  console.log(`[getUserIdFromRequest] Extracted userId from token: ${userId} (type: ${typeof userId})`);
  return String(userId); // Ensure it's a string for MongoDB comparison
};

const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const conversations = await conversationCore.getConversations(userId);
    res.status(200).json({ conversations });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const getConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[getConversation controller] Requested conversation ID: ${id}`);
    const userId = await getUserIdFromRequest(req);
    console.log(`[getConversation controller] User ID from token: ${userId}`);
    const conversation = await conversationCore.getConversation(id, userId);
    res.status(200).json({ conversation });
  } catch (e) {
    console.error(`[getConversation controller] Error:`, e);
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const createOrGetConversation = async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromRequest(req);
    console.log(`[createOrGetConversation] User ID: ${userId}`);
    const { agentId, subject } = req.body;
    console.log(`[createOrGetConversation] Agent ID: ${agentId}, Subject: ${subject}`);
    const conversation = await conversationCore.getOrCreateConversation({
      userId,
      agentId,
      subject,
    });
    console.log(`[createOrGetConversation] Created/retrieved conversation: ${conversation.id} for user ${conversation.userId}`);
    res.status(200).json({ conversation });
  } catch (e) {
    console.error(`[createOrGetConversation] Error:`, e);
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const getMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = await getUserIdFromRequest(req);
    const messages = await conversationCore.getMessages(id, userId);
    res.status(200).json({ messages });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const sendMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = await getUserIdFromRequest(req);
    const message = await conversationCore.sendMessage({
      conversationId: id,
      senderType: "user",
      content,
      userId,
    });
    res.status(201).json({ message });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = await getUserIdFromRequest(req);
    await conversationCore.markMessagesAsRead(id, userId);
    res.status(200).json({ success: true });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const markMessagesAsUnread = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = await getUserIdFromRequest(req);
    await conversationCore.markMessagesAsUnread(id, userId);
    res.status(200).json({ success: true });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const togglePinConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = await getUserIdFromRequest(req);
    const conversation = await conversationCore.togglePinConversation(id, userId);
    res.status(200).json({ conversation });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

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
