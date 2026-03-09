export enum Sentiment {
  POSITIVE = 'Positive',
  NEUTRAL = 'Neutral',
  NEGATIVE = 'Negative'
}

export interface FeedbackData {
  id: string;
  userEmail: string;
  text: string;
  rating: number;
  category: string;
  recommend: 'Yes' | 'No' | 'Maybe';
  followUp: boolean;
  location?: { lat: number; lng: number };
  locationName?: string;
  timestamp: number;
  
  // AI Analysis Fields
  sentimentLabel: string;
  sentimentMismatch: boolean;
  emotion: string;
  keywords: string[];
  aspects: { name: string; sentiment: string }[];
  flagged?: boolean;
  abusiveWords?: string[]; // Kept for backward compatibility
}

export interface DashboardMetrics {
  totalFeedbacks: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  trendData: { name: string; pos: number; neu: number; neg: number }[];
  topKeywords: { text: string; count: number }[];
  emotions: { label: string; percent: number }[];
  aspectScores: { name: string; val: number; type: 'Positive' | 'Neutral' | 'Negative' }[];
  locations: { lat: number; lng: number; sentiment: Sentiment; name?: string }[];
}

export interface UserData {
  email: string;
  isAdmin: boolean;
  isBanned: boolean;
  displayName?: string;
  photoURL?: string;
}