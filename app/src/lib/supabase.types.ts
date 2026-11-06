export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      houses: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      house_members: {
        Row: {
          id: string;
          house_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          display_name: string;
          avatar_type: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          display_name: string;
          avatar_type?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
          display_name?: string;
          avatar_type?: string | null;
          joined_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          house_id: string;
          invited_by: string;
          phone_or_email: string;
          status: 'pending' | 'accepted' | 'expired';
          code: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          invited_by: string;
          phone_or_email: string;
          status?: 'pending' | 'accepted' | 'expired';
          code?: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          invited_by?: string;
          phone_or_email?: string;
          status?: 'pending' | 'accepted' | 'expired';
          code?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          house_id: string;
          user_id: string;
          amount_cents: number;
          category_id: string;
          card_id: string | null;
          description: string;
          date: string;
          is_income: boolean;
          paid: boolean;
          essentiality: 'essential' | 'necessary' | 'extra' | null;
          tags: string[] | null;
          privacy: 'private' | 'shared' | null;
          installment_total: number | null;
          installment_current: number | null;
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          user_id: string;
          amount_cents: number;
          category_id: string;
          card_id?: string | null;
          description: string;
          date: string;
          is_income?: boolean;
          paid?: boolean;
          essentiality?: 'essential' | 'necessary' | 'extra' | null;
          tags?: string[] | null;
          privacy?: 'private' | 'shared' | null;
          installment_total?: number | null;
          installment_current?: number | null;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          user_id?: string;
          amount_cents?: number;
          category_id?: string;
          card_id?: string | null;
          description?: string;
          date?: string;
          is_income?: boolean;
          paid?: boolean;
          essentiality?: 'essential' | 'necessary' | 'extra' | null;
          tags?: string[] | null;
          privacy?: 'private' | 'shared' | null;
          installment_total?: number | null;
          installment_current?: number | null;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}