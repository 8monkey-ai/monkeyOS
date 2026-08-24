export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  monkeyos_app_template: {
    Tables: {
      members: {
        Row: {
          user_id: string;
          role: "admin" | "member";
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          user_id: string;
          role?: "admin" | "member";
          created_at?: string;
          created_by?: string | null;
        };
        Update: { role?: "admin" | "member" };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          occurred_at: string;
          actor_user_id: string | null;
          action: string;
          entity: string;
          record_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      work_items: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: "open" | "in_progress" | "done";
          created_at: string;
          created_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          status?: "open" | "in_progress" | "done";
          created_at?: string;
          created_by: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          status?: "open" | "in_progress" | "done";
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      add_member_by_email: {
        Args: { target_email: string; target_role?: "admin" | "member" };
        Returns: Database["monkeyos_app_template"]["Tables"]["members"]["Row"];
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_member: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Member = Database["monkeyos_app_template"]["Tables"]["members"]["Row"];
export type WorkItem = Database["monkeyos_app_template"]["Tables"]["work_items"]["Row"];
export type AuditEntry = Database["monkeyos_app_template"]["Tables"]["audit_log"]["Row"];
