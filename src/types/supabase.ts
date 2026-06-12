// Supabase CLI/MCP `generate_typescript_types`로 생성된 파일 — 직접 수정하지 말 것.
// 스키마 변경(마이그레이션) 후 재생성해서 갱신한다.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cells: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_items: {
        Row: {
          assignee_member_id: string | null
          carried_from: string | null
          content: string
          created_at: string
          done: boolean
          id: string
          meeting_id: string
          sort_order: number
        }
        Insert: {
          assignee_member_id?: string | null
          carried_from?: string | null
          content: string
          created_at?: string
          done?: boolean
          id?: string
          meeting_id: string
          sort_order?: number
        }
        Update: {
          assignee_member_id?: string | null
          carried_from?: string | null
          content?: string
          created_at?: string
          done?: boolean
          id?: string
          meeting_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "meeting_items_assignee_member_id_fkey"
            columns: ["assignee_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_items_carried_from_fkey"
            columns: ["carried_from"]
            isOneToOne: false
            referencedRelation: "meeting_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          id: string
          meeting_date: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_date: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_date?: string
          title?: string
        }
        Relationships: []
      }
      member_contact: {
        Row: {
          baptized: boolean | null
          birth_date: string | null
          member_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          baptized?: boolean | null
          birth_date?: string | null
          member_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          baptized?: boolean | null
          birth_date?: string | null
          member_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_contact_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_private: {
        Row: {
          address: string | null
          family_info: string | null
          member_id: string
          updated_at: string
          workplace: string | null
        }
        Insert: {
          address?: string | null
          family_info?: string | null
          member_id: string
          updated_at?: string
          workplace?: string | null
        }
        Update: {
          address?: string | null
          family_info?: string | null
          member_id?: string
          updated_at?: string
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_private_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          active: boolean
          cell_id: string | null
          created_at: string
          duty: string | null
          gender: string | null
          id: string
          is_officer: boolean
          name: string
          photo_path: string | null
          registered_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cell_id?: string | null
          created_at?: string
          duty?: string | null
          gender?: string | null
          id?: string
          is_officer?: boolean
          name: string
          photo_path?: string | null
          registered_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cell_id?: string | null
          created_at?: string
          duty?: string | null
          gender?: string | null
          id?: string
          is_officer?: boolean
          name?: string
          photo_path?: string | null
          registered_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          profile_id: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          profile_id: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          profile_id?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval: Database["public"]["Enums"]["approval_status"]
          created_at: string
          id: string
          kakao_nickname: string | null
          member_id: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          approval?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          id: string
          kakao_nickname?: string | null
          member_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          approval?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          id?: string
          kakao_nickname?: string | null
          member_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      service_assignments: {
        Row: {
          created_at: string
          id: string
          member_id: string
          role_id: string
          service_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          role_id: string
          service_date: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          role_id?: string
          service_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "service_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_roles: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      visit_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          visit_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          visit_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_requests: {
        Row: {
          confirmed_at: string | null
          created_at: string
          decline_reason: string | null
          id: string
          member_id: string
          message: string | null
          preferred_slots: Json
          proposed_slot: Json | null
          requested_by: string | null
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          decline_reason?: string | null
          id?: string
          member_id: string
          message?: string | null
          preferred_slots?: Json
          proposed_slot?: Json | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          decline_reason?: string | null
          id?: string
          member_id?: string
          message?: string | null
          preferred_slots?: Json
          proposed_slot?: Json | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_plans: {
        Row: {
          created_at: string
          id: string
          member_id: string
          note: string | null
          partner_name: string | null
          venue: string | null
          wedding_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          note?: string | null
          partner_name?: string | null
          venue?: string | null
          wedding_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          note?: string | null
          partner_name?: string | null
          venue?: string | null
          wedding_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      my_member_id: { Args: never; Returns: string }
      notify_pastors: {
        Args: {
          n_body: string
          n_link: string
          n_title: string
          n_type: string
        }
        Returns: undefined
      }
      push_notification: {
        Args: {
          n_body: string
          n_link: string
          n_title: string
          n_type: string
          target: string
        }
        Returns: undefined
      }
      role_at_least: {
        Args: { min_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      role_rank: {
        Args: { r: Database["public"]["Enums"]["user_role"] }
        Returns: number
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      user_role: "member" | "officer" | "staff" | "pastor"
      visit_status:
        | "requested"
        | "proposed"
        | "confirmed"
        | "completed"
        | "declined"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_status: ["pending", "approved", "rejected"],
      user_role: ["member", "officer", "staff", "pastor"],
      visit_status: [
        "requested",
        "proposed",
        "confirmed",
        "completed",
        "declined",
        "cancelled",
      ],
    },
  },
} as const
