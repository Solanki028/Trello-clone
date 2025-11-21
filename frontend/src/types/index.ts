export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
}

export interface Label {
  text: string;
  color: string;
}

export interface Card {
  _id: string;
  title: string;
  description: string;
  list: string;
  board: string;
  position: number;
  dueDate?: string | null;
  labels: Label[];
  assignee?: User | null;
  isCompleted: boolean;
  isArchived: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  _id: string;
  title: string;
  board: string;
  position: number;
  isArchived: boolean;
  cards?: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  user: User;
  role: 'owner' | 'member';
  addedAt: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  owner: User;
  members: BoardMember[];
  backgroundColor: string;
  isArchived: boolean;
  lists?: List[];
  createdAt: string;
  updatedAt: string;
}

export interface DueDateSuggestion {
  cardId: string;
  cardTitle: string;
  suggestedDate: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ListMovementSuggestion {
  cardId: string;
  cardTitle: string;
  currentList: string;
  suggestedList: string;
  suggestedListId: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RelatedCard {
  cardId: string;
  cardTitle: string;
  commonKeywords: string[];
}

export interface RelatedCardsGroup {
  mainCard: {
    cardId: string;
    cardTitle: string;
  };
  relatedCards: RelatedCard[];
  reason: string;
  suggestion: string;
}

export interface Recommendations {
  dueDateSuggestions: DueDateSuggestion[];
  listMovementSuggestions: ListMovementSuggestion[];
  relatedCards: RelatedCardsGroup[];
}

export interface Invitation {
  _id: string;
  board: Board;
  inviter: User;
  invitee: User;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
  updatedAt: string;
}
