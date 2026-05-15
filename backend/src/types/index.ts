export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  emotion?: Emotion;
}

export interface Emotion {
  type: EmotionType;
  intensity: number; // 0-1
}

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'excited'
  | 'lonely'
  | 'affectionate'
  | 'neutral'
  | 'shy'
  | 'romantic';

export interface MemoryEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  priority: number; // 1-10
  emotion?: Emotion;
  tags: string[];
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
}

export type MemoryCategory = 'high' | 'medium' | 'low';

export interface UserProfile {
  name: string;
  birthday: string;
  favoriteGames: string[];
  favoriteMusic: string[];
  personalityPreferences: string[];
  importantDates: { label: string; date: string }[];
}

export interface RelationshipMemory {
  anniversary: string;
  firstMeetingStory: string;
  relationshipLevel: number;
  sharedMemories: string[];
  specialMoments: { label: string; description: string; date: string }[];
}

export interface WSMessage {
  type: WsMessageType;
  payload: any;
}

export type WsMessageType =
  | 'chat'
  | 'chat_chunk'
  | 'chat_done'
  | 'emotion'
  | 'tts_audio'
  | 'tts_start'
  | 'tts_end'
  | 'memory_update'
  | 'error'
  | 'ping'
  | 'pong'
  | 'expression'
  | 'lip_sync';
