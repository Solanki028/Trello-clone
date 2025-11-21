import axios from 'axios';
import { AuthResponse, Board, List, Card, Recommendations, Invitation } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Board API
export const boardAPI = {
  getBoards: async (): Promise<Board[]> => {
    const { data } = await api.get('/boards');
    return data;
  },

  getBoard: async (id: string): Promise<Board> => {
    const { data } = await api.get(`/boards/${id}`);
    return data;
  },

  createBoard: async (title: string, description?: string, backgroundColor?: string): Promise<Board> => {
    const { data } = await api.post('/boards', { title, description, backgroundColor });
    return data;
  },

  updateBoard: async (id: string, updates: Partial<Board>): Promise<Board> => {
    const { data } = await api.put(`/boards/${id}`, updates);
    return data;
  },

  deleteBoard: async (id: string): Promise<void> => {
    await api.delete(`/boards/${id}`);
  },

  addMember: async (boardId: string, email: string): Promise<Board> => {
    const { data } = await api.post(`/boards/${boardId}/members`, { email });
    return data;
  },

  removeMember: async (boardId: string, userId: string): Promise<Board> => {
    const { data } = await api.delete(`/boards/${boardId}/members/${userId}`);
    return data;
  },

  getRecommendations: async (boardId: string): Promise<Recommendations> => {
    const { data } = await api.get(`/boards/${boardId}/recommendations`);
    return data;
  },
};

// List API
export const listAPI = {
  createList: async (title: string, boardId: string): Promise<List> => {
    const { data } = await api.post('/lists', { title, boardId });
    return data;
  },

  updateList: async (id: string, title: string): Promise<List> => {
    const { data } = await api.put(`/lists/${id}`, { title });
    return data;
  },

  reorderLists: async (boardId: string, lists: List[]): Promise<List[]> => {
    const { data } = await api.put('/lists/reorder', { boardId, lists });
    return data;
  },

  deleteList: async (id: string): Promise<void> => {
    await api.delete(`/lists/${id}`);
  },
};

// Card API
export const cardAPI = {
  createCard: async (
    title: string,
    listId: string,
    boardId: string,
    description?: string,
    dueDate?: string,
    labels?: { text: string; color: string }[]
  ): Promise<Card> => {
    const { data } = await api.post('/cards', {
      title,
      listId,
      boardId,
      description,
      dueDate,
      labels,
    });
    return data;
  },

  updateCard: async (id: string, updates: Partial<Card>): Promise<Card> => {
    const { data } = await api.put(`/cards/${id}`, updates);
    return data;
  },

  moveCard: async (id: string, listId: string, position: number): Promise<Card> => {
    const { data } = await api.put(`/cards/${id}/move`, { listId, position });
    return data;
  },

  reorderCards: async (listId: string, cards: Card[]): Promise<Card[]> => {
    const { data } = await api.put('/cards/reorder', { listId, cards });
    return data;
  },

  deleteCard: async (id: string): Promise<void> => {
    await api.delete(`/cards/${id}`);
  },
};

// Invitation API
export const invitationAPI = {
  sendInvitation: async (boardId: string, email: string, message?: string): Promise<Invitation> => {
    const { data } = await api.post('/invitations', { boardId, email, message });
    return data;
  },

  getUserInvitations: async (): Promise<Invitation[]> => {
    const { data } = await api.get('/invitations');
    return data;
  },

  getBoardInvitations: async (boardId: string): Promise<Invitation[]> => {
    const { data } = await api.get(`/invitations/board/${boardId}`);
    return data;
  },

  acceptInvitation: async (invitationId: string): Promise<{ message: string; board: Board }> => {
    const { data } = await api.put(`/invitations/${invitationId}/accept`);
    return data;
  },

  declineInvitation: async (invitationId: string): Promise<{ message: string }> => {
    const { data } = await api.put(`/invitations/${invitationId}/decline`);
    return data;
  },

  cancelInvitation: async (invitationId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/invitations/${invitationId}`);
    return data;
  },
};

export default api;
