// Shared types for DLOB platform

export interface Member {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'member';
  is_active: boolean;
  join_date: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  date: string;
  check_in_time: string;
  check_in_method: 'qr' | 'gps' | 'manual';
  location?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  type: 'daily' | 'monthly' | 'tournament';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_date?: string;
  payment_method?: 'cash' | 'transfer' | 'midtrans' | 'xendit';
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  court_number?: number;
  type: 'singles' | 'doubles';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MatchParticipant {
  id: string;
  match_id: string;
  member_id: string;
  team: 'team1' | 'team2';
  position?: 'player1' | 'player2'; // for doubles
}

export interface MatchResult {
  id: string;
  match_id: string;
  team1_score: number;
  team2_score: number;
  winner_team: 'team1' | 'team2';
  game_scores: Array<{
    game_number: number;
    team1_score: number;
    team2_score: number;
  }>;
  completed_at: string;
}

export interface AIInteraction {
  id: string;
  member_id?: string;
  type: 'payment_parse' | 'match_recommendation' | 'performance_analysis' | 'chat' | 'forecast';
  input_data: Record<string, any>;
  ai_response: Record<string, any>;
  confidence_score?: number;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Gemini AI types
export interface GeminiPrompt {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface PaymentParseRequest {
  message: string;
  context?: {
    members: Array<{ id: string; name: string; phone?: string }>;
    recent_payments: Array<Payment>;
  };
}

export interface PaymentParseResponse {
  member_id?: string;
  amount?: number;
  confidence: number;
  reasoning: string;
  suggestions?: string[];
}

export interface MatchRecommendationRequest {
  available_members: string[];
  match_history?: Array<{
    member_id: string;
    wins: number;
    losses: number;
    recent_performance: number;
  }>;
  preferences?: {
    skill_balance: boolean;
    avoid_recent_opponents: boolean;
  };
}

export interface MatchRecommendationResponse {
  recommended_matches: Array<{
    team1: string[];
    team2: string[];
    confidence: number;
    reasoning: string;
    expected_competitiveness: number;
  }>;
}

// Database table schemas
export interface DatabaseSchema {
  members: Member;
  attendance: Attendance;
  payments: Payment;
  matches: Match;
  match_participants: MatchParticipant;
  match_results: MatchResult;
  ai_interactions: AIInteraction;
}