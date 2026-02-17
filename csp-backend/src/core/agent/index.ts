import { BadRequestError, NotFoundError } from "../../common/errors.js";
import { agentDML } from "../../dml/agent.js";
import { IAIAgent } from "../../interfaces/index.js";
import { z } from "zod";

const createAgentSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  description: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  systemPrompt: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  voice: z.string().optional().nullable(),
  voiceSpeed: z.number().optional().nullable(),
});

export const createAgent = async (params: {
  name: string;
  description?: string | null;
  avatar?: string | null;
  systemPrompt?: string | null;
  email?: string | null;
  isActive?: boolean;
  voice?: string | null;
  voiceSpeed?: number | null;
}): Promise<IAIAgent> => {
  const parsed = createAgentSchema.safeParse(params);
  if (!parsed.success) {
    throw new BadRequestError("Invalid input", parsed.error.message);
  }

  return await agentDML.createAgent({
    name: parsed.data.name,
    description: parsed.data.description ?? undefined,
    avatar: parsed.data.avatar ?? undefined,
    systemPrompt: parsed.data.systemPrompt ?? undefined,
    email: parsed.data.email ?? undefined,
    isActive: parsed.data.isActive ?? true,
    voice: parsed.data.voice ?? undefined,
    voiceSpeed: parsed.data.voiceSpeed ?? undefined,
  });
};

export const getAgent = async (id: string): Promise<IAIAgent> => {
  const agent = await agentDML.getAgentById(id);
  if (!agent) {
    throw new NotFoundError("Agent not found");
  }
  return agent;
};

export const getAllAgents = async (): Promise<IAIAgent[]> => {
  return await agentDML.getActiveAgents();
};

export const searchAgents = async (searchTerm: string): Promise<IAIAgent[]> => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return await agentDML.getActiveAgents();
  }
  return await agentDML.searchAgents(searchTerm.trim());
};

export const updateAgent = async (
  id: string,
  params: {
    name?: string;
    description?: string | null;
    avatar?: string | null;
    systemPrompt?: string | null;
    email?: string | null;
    isActive?: boolean;
    voice?: string | null;
    voiceSpeed?: number | null;
  }
): Promise<IAIAgent> => {
  const agent = await agentDML.getAgentById(id);
  if (!agent) {
    throw new NotFoundError("Agent not found");
  }

  const updatedAgent = await agentDML.updateAgent(id, {
    name: params.name,
    description: params.description ?? undefined,
    avatar: params.avatar ?? undefined,
    systemPrompt: params.systemPrompt ?? undefined,
    email: params.email ?? undefined,
    isActive: params.isActive ?? undefined,
    voice: params.voice ?? undefined,
    voiceSpeed: params.voiceSpeed ?? undefined,
  });
  if (!updatedAgent) {
    throw new NotFoundError("Failed to update agent");
  }
  return updatedAgent;
};

export const deleteAgent = async (id: string): Promise<void> => {
  const agent = await agentDML.getAgentById(id);
  if (!agent) {
    throw new NotFoundError("Agent not found");
  }

  await agentDML.deleteAgent(id);
};

export const agentCore = {
  createAgent,
  getAgent,
  getAllAgents,
  searchAgents,
  updateAgent,
  deleteAgent,
};
