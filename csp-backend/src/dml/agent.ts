import prisma from "../db/prisma.js";
import { IAIAgent } from "../interfaces/index.js";

type AgentCreateData = {
  name: string;
  description?: string | null;
  avatar?: string | null;
  systemPrompt?: string | null;
  voice?: string | null;
  voiceSpeed?: number | null;
  email?: string | null;
  isActive?: boolean;
};

type AgentUpdateData = {
  name?: string;
  description?: string | null;
  avatar?: string | null;
  systemPrompt?: string | null;
  voice?: string | null;
  voiceSpeed?: number | null;
  email?: string | null;
  isActive?: boolean;
  deletedAt?: Date | null;
};

const createAgent = async (agent: AgentCreateData): Promise<IAIAgent> => {
  const newAgent = await prisma.aIAgent.create({
    data: {
      ...agent,
      deletedAt: null, // Explicitly set deletedAt to null
    },
  });
  return newAgent as IAIAgent;
};

const getAgentById = async (id: string): Promise<IAIAgent | null> => {
  const agent = await prisma.aIAgent.findFirst({
    where: { id, deletedAt: null },
  });
  return agent as IAIAgent | null;
};

const getAllAgents = async (): Promise<IAIAgent[]> => {
  const agents = await prisma.aIAgent.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return agents as IAIAgent[];
};

const getActiveAgents = async (): Promise<IAIAgent[]> => {
  const agents = await prisma.aIAgent.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return agents as IAIAgent[];
};

const searchAgents = async (searchTerm: string): Promise<IAIAgent[]> => {
  // MongoDB doesn't support case-insensitive search with 'mode', so we use regex
  const agents = await prisma.aIAgent.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        // @ts-ignore
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  // Filter case-insensitively in memory (backup)
  const lowerSearchTerm = searchTerm.toLowerCase();
  return agents.filter((agent: any) =>
    agent.name.toLowerCase().includes(lowerSearchTerm) ||
    (agent.description && agent.description.toLowerCase().includes(lowerSearchTerm)) ||
    (agent.email && agent.email.toLowerCase().includes(lowerSearchTerm))
  ) as IAIAgent[];
};

const updateAgent = async (id: string, agent: AgentUpdateData): Promise<IAIAgent | null> => {
  const updatedAgent = await prisma.aIAgent.update({
    where: { id },
    data: agent,
  });
  return updatedAgent as IAIAgent;
};

const deleteAgent = async (id: string): Promise<IAIAgent | null> => {
  const deletedAgent = await prisma.aIAgent.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return deletedAgent as IAIAgent;
};

export const agentDML = {
  createAgent,
  getAgentById,
  getAllAgents,
  getActiveAgents,
  searchAgents,
  updateAgent,
  deleteAgent,
};
