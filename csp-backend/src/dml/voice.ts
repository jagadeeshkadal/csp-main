import prisma from "../db/prisma";
import { IVoiceExchange } from "../interfaces";

type VoiceExchangeCreateData = {
  conversationId: string;
  userAudioUrl?: string | null;
  userTranscript?: string | null;
  agentResponse: string;
  agentAudioUrl?: string | null;
};

type VoiceExchangeUpdateData = {
  userAudioUrl?: string | null;
  userTranscript?: string | null;
  agentResponse?: string;
  agentAudioUrl?: string | null;
};

const createVoiceExchange = async (exchange: VoiceExchangeCreateData): Promise<IVoiceExchange> => {
  // Check if voiceExchange model exists in Prisma client
  if (!prisma.voiceExchange) {
    throw new Error("VoiceExchange model not found in Prisma client. Please run 'npm run generate' to regenerate the Prisma client.");
  }
  const newExchange = await prisma.voiceExchange.create({
    data: exchange,
  });
  return newExchange as IVoiceExchange;
};

const getVoiceExchangeById = async (id: string): Promise<IVoiceExchange | null> => {
  const exchange = await prisma.voiceExchange.findFirst({
    where: { id },
    include: {
      conversation: {
        include: {
          agent: true,
        },
      },
    },
  });
  return exchange as any;
};

const getVoiceExchangesByConversationId = async (conversationId: string): Promise<IVoiceExchange[]> => {
  if (!prisma.voiceExchange) {
    throw new Error("VoiceExchange model not found in Prisma client. Please run 'npm run generate' to regenerate the Prisma client.");
  }
  const exchanges = await prisma.voiceExchange.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
  return exchanges as IVoiceExchange[];
};

const updateVoiceExchange = async (id: string, exchange: VoiceExchangeUpdateData): Promise<IVoiceExchange | null> => {
  const updatedExchange = await prisma.voiceExchange.update({
    where: { id },
    data: exchange,
  });
  return updatedExchange as IVoiceExchange;
};

export const voiceDML = {
  createVoiceExchange,
  getVoiceExchangeById,
  getVoiceExchangesByConversationId,
  updateVoiceExchange,
};
