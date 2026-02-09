export interface IUser {
  id: string;
  phoneNumber: string;
  phoneExtension: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  jwt?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface IAIAgent {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  avatar?: string | null;
  systemPrompt?: string | null;
  voice?: string | null;
  voiceSpeed?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IEmailConversation {
  id: string;
  userId: string;
  agentId: string;
  agent?: IAIAgent; // Populated relation
  subject?: string | null;
  messages?: IEmailMessage[]; // Populated relation
  voiceExchanges?: IVoiceExchange[]; // Populated relation
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IEmailMessage {
  id: string;
  conversationId: string;
  senderType: 'user' | 'agent';
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVoiceExchange {
  id: string;
  conversationId: string;
  conversation?: IEmailConversation; // Populated relation
  userAudioUrl?: string | null;
  userTranscript?: string | null;
  agentResponse: string;
  agentAudioUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
