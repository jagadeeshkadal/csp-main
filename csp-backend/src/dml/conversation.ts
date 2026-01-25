import prisma from "../db/prisma.js";
import { IEmailConversation, IEmailMessage } from "../interfaces/index.js";

type ConversationCreateData = {
  userId: string;
  agentId: string;
  subject?: string | null;
};

type ConversationUpdateData = {
  subject?: string | null;
  deletedAt?: Date | null;
  isPinned?: boolean;
};

type MessageCreateData = {
  conversationId: string;
  senderType: 'user' | 'agent';
  content: string;
  isRead?: boolean;
};

type MessageUpdateData = {
  content?: string;
  isRead?: boolean;
};

// Conversation DMLs
const createConversation = async (conversation: ConversationCreateData): Promise<IEmailConversation> => {
  const newConversation = await prisma.emailConversation.create({
    data: {
      ...conversation,
      deletedAt: null, // Explicitly set deletedAt to null
    },
    include: {
      agent: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  return newConversation as any;
};

const getConversationById = async (id: string): Promise<IEmailConversation | null> => {
  console.log(`[getConversationById] Looking up conversation with ID: ${id}`);
  try {
    const conversation = await prisma.emailConversation.findFirst({
      where: { id, deletedAt: null },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    console.log(`[getConversationById] Query result:`, conversation ? `Found conversation with userId=${conversation.userId}` : 'null');

    // Also try without deletedAt filter to see if conversation exists at all
    if (!conversation) {
      const anyConversation = await prisma.emailConversation.findFirst({
        where: { id },
      });
      console.log(`[getConversationById] Conversation exists without deletedAt filter:`, anyConversation ? `deletedAt=${anyConversation.deletedAt}` : 'null');
    }

    return conversation as any;
  } catch (error) {
    console.error(`[getConversationById] Error querying conversation:`, error);
    throw error;
  }
};

const getConversationsByUserId = async (userId: string): Promise<IEmailConversation[]> => {
  const conversations = await prisma.emailConversation.findMany({
    where: { userId, deletedAt: null },
    include: {
      agent: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        // Get all messages to check for unread status
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return conversations as any;
};

const getConversationByUserAndAgent = async (userId: string, agentId: string): Promise<IEmailConversation | null> => {
  const conversation = await prisma.emailConversation.findFirst({
    where: { userId, agentId, deletedAt: null },
    include: {
      agent: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  return conversation as any;
};

const updateConversation = async (id: string, conversation: ConversationUpdateData): Promise<IEmailConversation | null> => {
  const updatedConversation = await prisma.emailConversation.update({
    where: { id },
    data: conversation,
  });
  return updatedConversation as IEmailConversation;
};

const deleteConversation = async (id: string): Promise<IEmailConversation | null> => {
  const deletedConversation = await prisma.emailConversation.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return deletedConversation as IEmailConversation;
};

// Message DMLs
const createMessage = async (message: MessageCreateData): Promise<IEmailMessage> => {
  const newMessage = await prisma.emailMessage.create({
    data: {
      ...message,
      isRead: message.isRead ?? false, // Explicitly set isRead
    },
  });

  // Update conversation's updatedAt timestamp
  await prisma.emailConversation.update({
    where: { id: message.conversationId },
    data: { updatedAt: new Date() },
  });

  return newMessage as IEmailMessage;
};

const getMessageById = async (id: string): Promise<IEmailMessage | null> => {
  const message = await prisma.emailMessage.findUnique({
    where: { id },
  });
  return message as IEmailMessage | null;
};

const getMessagesByConversationId = async (conversationId: string): Promise<IEmailMessage[]> => {
  const messages = await prisma.emailMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
  return messages as IEmailMessage[];
};

const updateMessage = async (id: string, message: MessageUpdateData): Promise<IEmailMessage | null> => {
  const updatedMessage = await prisma.emailMessage.update({
    where: { id },
    data: message,
  });
  return updatedMessage as IEmailMessage;
};

const markMessagesAsRead = async (conversationId: string, senderType: 'user' | 'agent'): Promise<void> => {
  await prisma.emailMessage.updateMany({
    where: {
      conversationId,
      senderType: senderType === 'user' ? 'agent' : 'user',
      isRead: false,
    },
    data: { isRead: true },
  });
};

const markMessagesAsUnread = async (conversationId: string, senderType: 'user' | 'agent'): Promise<void> => {
  await prisma.emailMessage.updateMany({
    where: {
      conversationId,
      senderType: senderType === 'user' ? 'agent' : 'user',
      isRead: true,
    },
    data: { isRead: false },
  });
};

export const conversationDML = {
  createConversation,
  getConversationById,
  getConversationsByUserId,
  getConversationByUserAndAgent,
  updateConversation,
  deleteConversation,
  createMessage,
  getMessageById,
  getMessagesByConversationId,
  updateMessage,
  markMessagesAsRead,
  markMessagesAsUnread,
};
