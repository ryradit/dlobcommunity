// Backend-specific types extending shared types

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
  position?: 'player1' | 'player2';
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

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