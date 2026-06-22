export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Participant {
  userId: User;
  joinedAt: string;
  leftAt?: string;
}

export interface Meeting {
  _id: string;
  title: string;
  hostId: User;
  workspaceId: string;
  roomId: string;
  status: 'scheduled' | 'live' | 'ended';
  participants: Participant[];
  scheduledAt: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  transcript: { speaker: string; text: string; timestamp: number }[];
  summary?: string;
  decisions?: string[];
  actionItems?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T;
  meetings?: T; // Alias for meeting routes
  message?: string;
}
