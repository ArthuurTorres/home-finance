export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TransactionTypeRow = 'income' | 'expense'

export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          user_id: string
          description: string
          date: string
          amount_cents: number
          due_day: number
          installments: number
          paid_installments: number
          is_paid: boolean
          is_recurring: boolean
          category: string
          card_id: string
          bank_id: string | null
          type: TransactionTypeRow
          member_id: string | null
          essentiality: 'essential' | 'necessary' | 'extra' | null
          tags: string[]
          privacy: 'family' | 'personal' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id?: string
          description: string
          date: string
          amount_cents: number
          due_day: number
          installments?: number
          paid_installments?: number
          is_paid?: boolean
          is_recurring?: boolean
          category: string
          card_id: string
          bank_id?: string | null
          type?: TransactionTypeRow
          member_id?: string | null
          essentiality?: 'essential' | 'necessary' | 'extra' | null
          tags?: string[]
          privacy?: 'family' | 'personal' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          date?: string
          amount_cents?: number
          due_day?: number
          installments?: number
          paid_installments?: number
          is_paid?: boolean
          is_recurring?: boolean
          category?: string
          card_id?: string
          bank_id?: string | null
          type?: TransactionTypeRow
          member_id?: string | null
          essentiality?: 'essential' | 'necessary' | 'extra' | null
          tags?: string[]
          privacy?: 'family' | 'personal' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      banks: {
        Row: {
          user_id: string
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          user_id?: string
          id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          user_id: string
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          user_id?: string
          id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          user_id: string
          name: string
          icon: string | null
          created_at: string
        }
        Insert: {
          user_id?: string
          name: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          name?: string
          icon?: string | null
          created_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          avatar: string | null
          created_at: string
        }
        Insert: {
          id: string
          user_id?: string
          name: string
          color: string
          avatar?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          avatar?: string | null
          created_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          user_id: string
          category: string
          limit_cents: number
        }
        Insert: {
          user_id?: string
          category: string
          limit_cents: number
        }
        Update: {
          user_id?: string
          category?: string
          limit_cents?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_cents: number
          current_cents: number
          deadline: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id: string
          user_id?: string
          name: string
          target_cents: number
          current_cents?: number
          deadline?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_cents?: number
          current_cents?: number
          deadline?: string | null
          color?: string | null
          created_at?: string
        }
        Relationships: []
      }
      preferences: {
        Row: {
          user_id: string
          dashboard_order: string[]
          active_member_id: string | null
          updated_at: string
        }
        Insert: {
          user_id?: string
          dashboard_order?: string[]
          active_member_id?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          dashboard_order?: string[]
          active_member_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
