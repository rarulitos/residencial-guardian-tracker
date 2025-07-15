export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      billing_periods: {
        Row: {
          created_at: string;
          id: string;
          month: number;
          name: string;
          user_id: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          month: number;
          name: string;
          user_id: string;
          year: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          month?: number;
          name?: string;
          user_id?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "billing_periods_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          billing_period_id: string;
          created_at: string;
          end_date: string;
          id: string;
          name: string;
          start_date: string;
          user_id: string;
        };
        Insert: {
          billing_period_id: string;
          created_at?: string;
          end_date: string;
          id?: string;
          name: string;
          start_date: string;
          user_id: string;
        };
        Update: {
          billing_period_id?: string;
          created_at?: string;
          end_date?: string;
          id?: string;
          name?: string;
          start_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_billing_period_id_fkey";
            columns: ["billing_period_id"];
            isOneToOne: false;
            referencedRelation: "billing_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "groups_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      worker_hospedaje: {
        Row: {
          date: string;
          has_hospedaje: boolean;
          id: string;
          worker_id: string;
        };
        Insert: {
          date: string;
          has_hospedaje?: boolean;
          id?: string;
          worker_id: string;
        };
        Update: {
          date?: string;
          has_hospedaje?: boolean;
          id?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worker_hospedaje_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
        ];
      };
      workers: {
        Row: {
          billing_period_id: string;
          created_at: string;
          group_id: string | null;
          id: string;
          name: string;
          position: string;
          user_id: string;
        };
        Insert: {
          billing_period_id: string;
          created_at?: string;
          group_id?: string | null;
          id?: string;
          name: string;
          position: string;
          user_id: string;
        };
        Update: {
          billing_period_id?: string;
          created_at?: string;
          group_id?: string | null;
          id?: string;
          name?: string;
          position?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workers_billing_period_id_fkey";
            columns: ["billing_period_id"];
            isOneToOne: false;
            referencedRelation: "billing_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workers_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[keyof Database]["Tables"];

export type Tables<T extends keyof PublicSchema> = PublicSchema[T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

export type BillingPeriod = Tables<"billing_periods">;
export type Group = Tables<"groups">;
export type Worker = Tables<"workers">;
export type WorkerHospedaje = Tables<"worker_hospedaje">;

export type WorkerWithHospedaje = Worker & {
  hospedaje: WorkerHospedaje[];
};

export type GroupWithWorkers = Group & {
  workers: WorkerWithHospedaje[];
};
