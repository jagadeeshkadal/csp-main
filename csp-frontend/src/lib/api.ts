import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
// Add auth token to requests
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API Interceptor] Added Authorization header for:', config.url);
  } else {
    console.warn('[API Interceptor] No token found for request:', config.url);
  }
  return config;
});

export interface SSOSignupRequest {
  token: string;
  phoneNumber: string;
  teamNumber?: string;
  departmentName?: string;
  avatar?: string | null;
}

export interface SignInRequest {
  token: string;
}

export interface AuthResponse {
  user: {
    id: string;
    phoneNumber: string;
    phoneExtension: string;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    jwt?: string | null;
    teamNumber?: string | null;
    departmentName?: string | null;
  };
  token: string;
}

export type AIAgent = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  avatar?: string | null;
  systemPrompt?: string | null;
  voice?: string | null;
  voiceSpeed?: number | null;
  email?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmailConversation = {
  id: string;
  userId: string;
  agentId: string;
  agent?: AIAgent;
  subject?: string | null;
  messages?: EmailMessage[];
  createdAt: string;
  updatedAt: string;
};

export type EmailMessage = {
  id: string;
  conversationId: string;
  senderType: 'user' | 'agent';
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

// Helper function to store user data in localStorage
const storeUserData = (user: AuthResponse['user'], token: string) => {
  // Store JWT token
  localStorage.setItem('authToken', token);

  // Store user ID separately for easy access
  localStorage.setItem('userId', user.id);

  // Store complete user data
  localStorage.setItem('user', JSON.stringify(user));

  // Store individual user fields for convenience
  if (user.email) {
    localStorage.setItem('userEmail', user.email);
  }
  if (user.name) {
    localStorage.setItem('userName', user.name);
  }
  localStorage.setItem('userPhoneNumber', user.phoneNumber);
  localStorage.setItem('userPhoneExtension', user.phoneExtension);
};

export const authAPI = {
  ssoSignup: async (data: SSOSignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/sso-signup', data);
    if (response.data.token && response.data.user) {
      storeUserData(response.data.user, response.data.token);
    }
    return response.data;
  },

  signIn: async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/sign-in', data);
    if (response.data.token && response.data.user) {
      storeUserData(response.data.user, response.data.token);
    }
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: AuthResponse['user'] }> => {
    try {
      // Verify token exists before making request
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('[getCurrentUser] No token found in localStorage');
        throw new Error('No authentication token found');
      }

      console.log('[getCurrentUser] Making request with token:', token.substring(0, 20) + '...');
      const response = await api.get<{ user: AuthResponse['user'] }>('/getUserData');
      if (response.data.user) {
        // Update stored user data
        storeUserData(response.data.user, token);
      }
      return response.data;
    } catch (error: any) {
      console.error('[getCurrentUser] Error:', error);
      console.error('[getCurrentUser] Request URL:', error.config?.url);
      console.error('[getCurrentUser] Request headers:', error.config?.headers);
      console.error('[getCurrentUser] Response status:', error.response?.status);
      console.error('[getCurrentUser] Response data:', error.response?.data);
      throw error;
    }
  },

  updateUser: async (data: any): Promise<AuthResponse> => {
    const response = await api.put<AuthResponse>('/users/profile', data);
    if (response.data.user) {
      const token = localStorage.getItem('authToken');
      if (token) {
        storeUserData(response.data.user, token);
      }
    }
    return response.data;
  },

};

export const agentAPI = {
  getAllAgents: async (): Promise<{ agents: AIAgent[] }> => {
    const response = await api.get<{ agents: AIAgent[] }>('/agents');
    return response.data;
  },

  searchAgents: async (searchTerm: string): Promise<{ agents: AIAgent[] }> => {
    const response = await api.get<{ agents: AIAgent[] }>('/agents/search', {
      params: { q: searchTerm },
    });
    return response.data;
  },

  getAgent: async (id: string): Promise<{ agent: AIAgent }> => {
    const response = await api.get<{ agent: AIAgent }>(`/agents/${id}`);
    return response.data;
  },
};

export interface VoiceExchange {
  id: string;
  conversationId: string;
  userAudioUrl?: string | null;
  userTranscript?: string | null;
  agentResponse: string;
  agentAudioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const conversationAPI = {
  getConversations: async (): Promise<{ conversations: EmailConversation[] }> => {
    const response = await api.get<{ conversations: EmailConversation[] }>('/conversations');
    return response.data;
  },

  getConversation: async (id: string): Promise<{ conversation: EmailConversation }> => {
    const response = await api.get<{ conversation: EmailConversation }>(`/conversations/${id}`);
    return response.data;
  },

  createOrGetConversation: async (agentId: string, subject?: string): Promise<{ conversation: EmailConversation }> => {
    const response = await api.post<{ conversation: EmailConversation }>('/conversations', {
      agentId,
      subject,
    });
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<{ messages: EmailMessage[] }> => {
    const response = await api.get<{ messages: EmailMessage[] }>(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<{ message: EmailMessage }> => {
    const response = await api.post<{ message: EmailMessage }>(`/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  },

  markMessagesAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(`/conversations/${conversationId}/messages/read`);
    return response.data;
  },

  markMessagesAsUnread: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(`/conversations/${conversationId}/messages/unread`);
    return response.data;
  },

  togglePinConversation: async (conversationId: string): Promise<{ conversation: EmailConversation }> => {
    const response = await api.post<{ conversation: EmailConversation }>(`/conversations/${conversationId}/pin`);
    return response.data;
  },
};

export const voiceAPI = {
  processVoiceText: async (conversationId: string, text: string): Promise<{ exchange: VoiceExchange }> => {
    const response = await api.post<{ exchange: VoiceExchange }>(
      `/conversations/${conversationId}/voice`,
      { text }
    );
    return response.data;
  },

  getVoiceExchanges: async (conversationId: string): Promise<{ exchanges: VoiceExchange[] }> => {
    const response = await api.get<{ exchanges: VoiceExchange[] }>(`/conversations/${conversationId}/voice`);
    return response.data;
  },
};

export default api;
