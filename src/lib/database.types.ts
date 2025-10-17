export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          customer_id: string
          id: string
          is_active: boolean | null
          sales_rep_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          customer_id: string
          id?: string
          is_active?: boolean | null
          sales_rep_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          customer_id?: string
          id?: string
          is_active?: boolean | null
          sales_rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          address: string
          annual_consumption: number | null
          avg_consumption: number | null
          created_at: string | null
          current_supplier: string | null
          customer_number: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          district: string
          email: string | null
          id: string
          installation_number: string | null
          is_free_consumer: boolean | null
          location: unknown | null
          meter_number: string | null
          name: string
          offer_history: Json | null
          phone: string | null
          tariff: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          annual_consumption?: number | null
          avg_consumption?: number | null
          created_at?: string | null
          current_supplier?: string | null
          customer_number?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          district: string
          email?: string | null
          id?: string
          installation_number?: string | null
          is_free_consumer?: boolean | null
          location?: unknown | null
          meter_number?: string | null
          name: string
          offer_history?: Json | null
          phone?: string | null
          tariff?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          annual_consumption?: number | null
          avg_consumption?: number | null
          created_at?: string | null
          current_supplier?: string | null
          customer_number?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          district?: string
          email?: string | null
          id?: string
          installation_number?: string | null
          is_free_consumer?: boolean | null
          location?: unknown | null
          meter_number?: string | null
          name?: string
          offer_history?: Json | null
          phone?: string | null
          tariff?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          is_read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          }
        ]
      }
      sales_reps: {
        Row: {
          created_at: string | null
          daily_target: number | null
          district: string | null
          email: string
          id: string
          is_active: boolean | null
          location: unknown | null
          name: string
          phone: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          daily_target?: number | null
          district?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          location?: unknown | null
          name: string
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          daily_target?: number | null
          district?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          location?: unknown | null
          name?: string
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_reps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      solar_leads: {
        Row: {
          created_at: string | null
          customer_id: string
          estimated_capacity: number | null
          estimated_cost: number | null
          follow_up_date: string | null
          id: string
          kvkk_consent: boolean | null
          notes: string | null
          sales_rep_id: string
          solutions: string[]
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          estimated_capacity?: number | null
          estimated_cost?: number | null
          follow_up_date?: string | null
          id?: string
          kvkk_consent?: boolean | null
          notes?: string | null
          sales_rep_id: string
          solutions: string[]
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          estimated_capacity?: number | null
          estimated_cost?: number | null
          follow_up_date?: string | null
          id?: string
          kvkk_consent?: boolean | null
          notes?: string | null
          sales_rep_id?: string
          solutions?: string[]
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solar_leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solar_leads_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          }
        ]
      }
      tariffs: {
        Row: {
          created_at: string | null
          customer_types: Database["public"]["Enums"]["customer_type"][]
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          customer_types: Database["public"]["Enums"]["customer_type"][]
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          customer_types?: Database["public"]["Enums"]["customer_type"][]
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          unit_price?: number
        }
        Relationships: []
      }
      visit_notes: {
        Row: {
          created_at: string | null
          id: string
          is_private: boolean | null
          note: string
          sales_rep_id: string
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note: string
          sales_rep_id: string
          visit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note?: string
          sales_rep_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_notes_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          }
        ]
      }
      visits: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          contract_signed: boolean | null
          created_at: string | null
          customer_id: string
          distance_km: number | null
          estimated_duration: unknown | null
          id: string
          notes: string | null
          planned_time: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          result: string | null
          revenue_amount: number | null
          sales_rep_id: string
          status: Database["public"]["Enums"]["visit_status"] | null
          updated_at: string | null
          visit_date: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          contract_signed?: boolean | null
          created_at?: string | null
          customer_id: string
          distance_km?: number | null
          estimated_duration?: unknown | null
          id?: string
          notes?: string | null
          planned_time?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          result?: string | null
          revenue_amount?: number | null
          sales_rep_id: string
          status?: Database["public"]["Enums"]["visit_status"] | null
          updated_at?: string | null
          visit_date: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          contract_signed?: boolean | null
          created_at?: string | null
          customer_id?: string
          distance_km?: number | null
          estimated_duration?: unknown | null
          id?: string
          notes?: string | null
          planned_time?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          result?: string | null
          revenue_amount?: number | null
          sales_rep_id?: string
          status?: Database["public"]["Enums"]["visit_status"] | null
          updated_at?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_sales_rep: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      customer_type: "residential" | "commercial" | "industrial"
      message_type: "direct" | "broadcast" | "system"
      notification_type: "assignment" | "visit" | "system" | "message"
      priority_level: "high" | "medium" | "low"
      user_role: "sales_rep" | "manager"
      visit_status: "planned" | "in_progress" | "completed" | "cancelled" | "no_answer" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}