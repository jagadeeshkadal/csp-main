import { Request, Response } from "express";
import { agentCore } from "../../core/agent/index.js";
import { BaseError } from "../../common/errors.js";

const getAllAgents = async (req: Request, res: Response) => {
  try {
    const agents = await agentCore.getAllAgents();
    res.status(200).json({ agents });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const searchAgents = async (req: Request, res: Response) => {
  try {
    const searchTerm = (req.query.q as string) || "";
    const agents = await agentCore.searchAgents(searchTerm);
    res.status(200).json({ agents });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const getAgent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const agent = await agentCore.getAgent(id);
    res.status(200).json({ agent });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const createAgent = async (req: Request, res: Response) => {
  try {
    const { name, description, avatar, systemPrompt, email, isActive, voice, voiceSpeed } = req.body;
    const agent = await agentCore.createAgent({
      name,
      description,
      avatar,
      systemPrompt,
      email,
      isActive,
      voice,
      voiceSpeed,
    });
    res.status(201).json({ agent });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const updateAgent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, avatar, systemPrompt, email, isActive, voice, voiceSpeed } = req.body;
    const agent = await agentCore.updateAgent(id, {
      name,
      description,
      avatar,
      systemPrompt,
      email,
      isActive,
      voice,
      voiceSpeed,
    });
    res.status(200).json({ agent });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const deleteAgent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await agentCore.deleteAgent(id);
    res.status(200).json({ message: "Agent deleted successfully" });
  } catch (e) {
    if (e instanceof BaseError) {
      res.status(e.status).json({ message: e.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export default {
  getAllAgents,
  searchAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
};
