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
      agent_job_state: {
        Row: {
          job: string
          paused_at: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          job: string
          paused_at?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          job?: string
          paused_at?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_trace_nodes: {
        Row: {
          address: string
          classification: string | null
          created_at: string
          depth: number
          edge: Json
          entity_category: string | null
          entity_name: string | null
          error: string | null
          evidence: Json
          id: string
          labels: Json
          network: string
          parent_id: string | null
          risk_score: number | null
          status: string
          trace_id: string
          updated_at: string
          verdict: string | null
        }
        Insert: {
          address: string
          classification?: string | null
          created_at?: string
          depth?: number
          edge?: Json
          entity_category?: string | null
          entity_name?: string | null
          error?: string | null
          evidence?: Json
          id?: string
          labels?: Json
          network: string
          parent_id?: string | null
          risk_score?: number | null
          status?: string
          trace_id: string
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          address?: string
          classification?: string | null
          created_at?: string
          depth?: number
          edge?: Json
          entity_category?: string | null
          entity_name?: string | null
          error?: string | null
          evidence?: Json
          id?: string
          labels?: Json
          network?: string
          parent_id?: string | null
          risk_score?: number | null
          status?: string
          trace_id?: string
          updated_at?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_trace_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "agent_trace_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_trace_nodes_trace_id_fkey"
            columns: ["trace_id"]
            isOneToOne: false
            referencedRelation: "agent_traces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_traces: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          depth_limit: number
          error: string | null
          id: string
          lease_expires_at: string | null
          max_downstream_risk: number | null
          narrative: string | null
          narrative_validation: Json
          network: string
          node_budget: number
          nodes_done: number
          record_id: string | null
          root_address: string
          runs: number
          source: string
          started_at: string | null
          status: string
          trigger_reason: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          depth_limit?: number
          error?: string | null
          id?: string
          lease_expires_at?: string | null
          max_downstream_risk?: number | null
          narrative?: string | null
          narrative_validation?: Json
          network: string
          node_budget?: number
          nodes_done?: number
          record_id?: string | null
          root_address: string
          runs?: number
          source?: string
          started_at?: string | null
          status?: string
          trigger_reason?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          depth_limit?: number
          error?: string | null
          id?: string
          lease_expires_at?: string | null
          max_downstream_risk?: number | null
          narrative?: string | null
          narrative_validation?: Json
          network?: string
          node_budget?: number
          nodes_done?: number
          record_id?: string | null
          root_address?: string
          runs?: number
          source?: string
          started_at?: string | null
          status?: string
          trigger_reason?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_traces_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "investigation_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_traces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          monthly_quota: number
          name: string
          plan: string
          rate_limit_per_min: number
          revoked_at: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          monthly_quota?: number
          name?: string
          plan?: string
          rate_limit_per_min?: number
          revoked_at?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          monthly_quota?: number
          name?: string
          plan?: string
          rate_limit_per_min?: number
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      api_requests: {
        Row: {
          api_key_id: string
          created_at: string
          duration_ms: number
          endpoint: string
          id: string
          status_code: number
        }
        Insert: {
          api_key_id: string
          created_at?: string
          duration_ms?: number
          endpoint: string
          id?: string
          status_code?: number
        }
        Update: {
          api_key_id?: string
          created_at?: string
          duration_ms?: number
          endpoint?: string
          id?: string
          status_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_requests_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          metadata: Json | null
          record_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      entity_attributions: {
        Row: {
          address: string
          confidence: number
          created_at: string
          entity_category: string
          entity_name: string
          id: string
          metadata: Json
          network: string
          source: string
          updated_at: string
          verified_at: string | null
          workspace_id: string | null
        }
        Insert: {
          address: string
          confidence?: number
          created_at?: string
          entity_category: string
          entity_name: string
          id?: string
          metadata?: Json
          network: string
          source?: string
          updated_at?: string
          verified_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          address?: string
          confidence?: number
          created_at?: string
          entity_category?: string
          entity_name?: string
          id?: string
          metadata?: Json
          network?: string
          source?: string
          updated_at?: string
          verified_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_attributions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      health_reports: {
        Row: {
          address: string
          created_at: string
          id: string
          network: string
          report: Json
          risk_score: number
          verdict: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          network: string
          report: Json
          risk_score: number
          verdict: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          network?: string
          report?: Json
          risk_score?: number
          verdict?: string
        }
        Relationships: []
      }
      investigation_records: {
        Row: {
          ai_summary: string | null
          ai_summary_generated_at: string | null
          ai_summary_previous: string | null
          ai_summary_status: string | null
          analysis_data: Json | null
          analyst_id: string | null
          analyst_notes: string | null
          assigned_to: string | null
          case_created_at: string | null
          case_id: string | null
          case_status: string | null
          created_at: string
          id: string
          investigation_status: string | null
          is_case: boolean
          network: string
          record_id: string
          reviewed_at: string | null
          risk_level: string
          risk_score: number
          tags: string[] | null
          updated_at: string
          user_id: string
          wallet_address: string
          workspace_id: string | null
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_generated_at?: string | null
          ai_summary_previous?: string | null
          ai_summary_status?: string | null
          analysis_data?: Json | null
          analyst_id?: string | null
          analyst_notes?: string | null
          assigned_to?: string | null
          case_created_at?: string | null
          case_id?: string | null
          case_status?: string | null
          created_at?: string
          id?: string
          investigation_status?: string | null
          is_case?: boolean
          network: string
          record_id: string
          reviewed_at?: string | null
          risk_level?: string
          risk_score?: number
          tags?: string[] | null
          updated_at?: string
          user_id: string
          wallet_address: string
          workspace_id?: string | null
        }
        Update: {
          ai_summary?: string | null
          ai_summary_generated_at?: string | null
          ai_summary_previous?: string | null
          ai_summary_status?: string | null
          analysis_data?: Json | null
          analyst_id?: string | null
          analyst_notes?: string | null
          assigned_to?: string | null
          case_created_at?: string | null
          case_id?: string | null
          case_status?: string | null
          created_at?: string
          id?: string
          investigation_status?: string | null
          is_case?: boolean
          network?: string
          record_id?: string
          reviewed_at?: string | null
          risk_level?: string
          risk_score?: number
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investigation_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      malicious_addresses: {
        Row: {
          address: string
          category: string
          created_at: string
          id: string
          label: string | null
          metadata: Json
          network: string
          source: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          address: string
          category?: string
          created_at?: string
          id?: string
          label?: string | null
          metadata?: Json
          network: string
          source?: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          category?: string
          created_at?: string
          id?: string
          label?: string | null
          metadata?: Json
          network?: string
          source?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_email_enabled: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          alert_email_enabled?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          alert_email_enabled?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_checks: {
        Row: {
          address: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          network: string
          reasons: Json
          risk_score: number
          verdict: string
          view_count: number
        }
        Insert: {
          address: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          network: string
          reasons?: Json
          risk_score?: number
          verdict: string
          view_count?: number
        }
        Update: {
          address?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          network?: string
          reasons?: Json
          risk_score?: number
          verdict?: string
          view_count?: number
        }
        Relationships: []
      }
      risk_factors: {
        Row: {
          created_at: string
          description: string | null
          detected_at: string
          factor_type: string
          id: string
          lookup_record_id: string
          score: number
          severity: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          detected_at?: string
          factor_type: string
          id?: string
          lookup_record_id: string
          score?: number
          severity?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          detected_at?: string
          factor_type?: string
          id?: string
          lookup_record_id?: string
          score?: number
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_factors_lookup_record_id_fkey"
            columns: ["lookup_record_id"]
            isOneToOne: false
            referencedRelation: "investigation_records"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_policies: {
        Row: {
          blocked_categories: string[]
          category_overrides: Json
          caution_threshold: number
          created_at: string
          created_by: string | null
          danger_threshold: number
          id: string
          is_active: boolean
          name: string
          rule_weights: Json
          version: number
          workspace_id: string
        }
        Insert: {
          blocked_categories?: string[]
          category_overrides?: Json
          caution_threshold?: number
          created_at?: string
          created_by?: string | null
          danger_threshold?: number
          id?: string
          is_active?: boolean
          name?: string
          rule_weights?: Json
          version?: number
          workspace_id: string
        }
        Update: {
          blocked_categories?: string[]
          category_overrides?: Json
          caution_threshold?: number
          created_at?: string
          created_by?: string | null
          danger_threshold?: number
          id?: string
          is_active?: boolean
          name?: string
          rule_weights?: Json
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rulesets: {
        Row: {
          created_at: string
          definition: Json
          definition_hash: string
          id: string
          is_active: boolean
          notes: string | null
          version: string
        }
        Insert: {
          created_at?: string
          definition: Json
          definition_hash: string
          id?: string
          is_active?: boolean
          notes?: string | null
          version: string
        }
        Update: {
          created_at?: string
          definition?: Json
          definition_hash?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          version?: string
        }
        Relationships: []
      }
      sanctions_addresses: {
        Row: {
          address: string
          created_at: string
          date_listed: string | null
          entity_name: string | null
          id: string
          metadata: Json | null
          network: string
          program: string | null
          source_list: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          date_listed?: string | null
          entity_name?: string | null
          id?: string
          metadata?: Json | null
          network: string
          program?: string | null
          source_list?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          date_listed?: string | null
          entity_name?: string | null
          id?: string
          metadata?: Json | null
          network?: string
          program?: string | null
          source_list?: string
          updated_at?: string
        }
        Relationships: []
      }
      sanctions_screening: {
        Row: {
          confidence_score: number
          created_at: string
          entity_name: string
          entity_type: string | null
          id: string
          lookup_record_id: string
          match_type: string
          screening_date: string
          source_list: string | null
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          entity_name: string
          entity_type?: string | null
          id?: string
          lookup_record_id: string
          match_type?: string
          screening_date?: string
          source_list?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          entity_name?: string
          entity_type?: string | null
          id?: string
          lookup_record_id?: string
          match_type?: string
          screening_date?: string
          source_list?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sanctions_screening_lookup_record_id_fkey"
            columns: ["lookup_record_id"]
            isOneToOne: false
            referencedRelation: "investigation_records"
            referencedColumns: ["id"]
          },
        ]
      }
      sar_drafts: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          evidence_bundle: Json
          id: string
          narrative: string
          network: string | null
          record_id: string | null
          status: string
          updated_at: string
          validation: Json
          workspace_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          evidence_bundle?: Json
          id?: string
          narrative: string
          network?: string | null
          record_id?: string | null
          status?: string
          updated_at?: string
          validation?: Json
          workspace_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          evidence_bundle?: Json
          id?: string
          narrative?: string
          network?: string | null
          record_id?: string | null
          status?: string
          updated_at?: string
          validation?: Json
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sar_drafts_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "investigation_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sar_drafts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_decisions: {
        Row: {
          address: string
          api_key_id: string | null
          block_height: number | null
          created_at: string
          entity_category: string | null
          id: string
          network: string
          payload_hash: string | null
          policy_id: string | null
          provenance: Json
          provider_payloads: Json
          risk_score: number
          rules_evaluated: Json
          ruleset_hash: string | null
          ruleset_version: string
          sanctions_snapshot_date: string | null
          source: string
          user_id: string | null
          verdict: string
          workspace_id: string | null
        }
        Insert: {
          address: string
          api_key_id?: string | null
          block_height?: number | null
          created_at?: string
          entity_category?: string | null
          id?: string
          network: string
          payload_hash?: string | null
          policy_id?: string | null
          provenance?: Json
          provider_payloads?: Json
          risk_score?: number
          rules_evaluated?: Json
          ruleset_hash?: string | null
          ruleset_version?: string
          sanctions_snapshot_date?: string | null
          source?: string
          user_id?: string | null
          verdict: string
          workspace_id?: string | null
        }
        Update: {
          address?: string
          api_key_id?: string | null
          block_height?: number | null
          created_at?: string
          entity_category?: string | null
          id?: string
          network?: string
          payload_hash?: string | null
          policy_id?: string | null
          provenance?: Json
          provider_payloads?: Json
          risk_score?: number
          rules_evaluated?: Json
          ruleset_hash?: string | null
          ruleset_version?: string
          sanctions_snapshot_date?: string | null
          source?: string
          user_id?: string | null
          verdict?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screening_decisions_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_cache: {
        Row: {
          address: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          network: string
        }
        Insert: {
          address: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          network: string
        }
        Update: {
          address?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          network?: string
        }
        Relationships: []
      }
      watch_alerts: {
        Row: {
          alert_message: string | null
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          new_value: string | null
          old_value: string | null
          risk_change: number | null
          watched_wallet_id: string
        }
        Insert: {
          alert_message?: string | null
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          new_value?: string | null
          old_value?: string | null
          risk_change?: number | null
          watched_wallet_id: string
        }
        Update: {
          alert_message?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          new_value?: string | null
          old_value?: string | null
          risk_change?: number | null
          watched_wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_alerts_watched_wallet_id_fkey"
            columns: ["watched_wallet_id"]
            isOneToOne: false
            referencedRelation: "watched_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      watched_wallets: {
        Row: {
          alert_threshold: number
          created_at: string
          current_risk_score: number | null
          id: string
          initial_risk_score: number | null
          last_checked: string
          network: string
          status: string
          updated_at: string
          user_id: string
          wallet_address: string
          watch_reason: string | null
          workspace_id: string | null
        }
        Insert: {
          alert_threshold?: number
          created_at?: string
          current_risk_score?: number | null
          id?: string
          initial_risk_score?: number | null
          last_checked?: string
          network: string
          status?: string
          updated_at?: string
          user_id: string
          wallet_address: string
          watch_reason?: string | null
          workspace_id?: string | null
        }
        Update: {
          alert_threshold?: number
          created_at?: string
          current_risk_score?: number | null
          id?: string
          initial_risk_score?: number | null
          last_checked?: string
          network?: string
          status?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string
          watch_reason?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watched_wallets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt: number
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          signature: string | null
          status_code: number | null
        }
        Insert: {
          attempt?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          signature?: string | null
          status_code?: number | null
        }
        Update: {
          attempt?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          signature?: string | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          events: string[]
          id: string
          is_active: boolean
          secret_hash: string
          secret_prefix: string
          updated_at: string
          url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          secret_hash: string
          secret_prefix: string
          updated_at?: string
          url: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          secret_hash?: string
          secret_prefix?: string
          updated_at?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          invited_email: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      api_usage_this_month: { Args: { _key_id: string }; Returns: number }
      generate_case_id: { Args: never; Returns: string }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      verify_cron_secret: { Args: { _provided: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "analyst" | "user"
      workspace_role:
        | "owner"
        | "compliance_officer"
        | "analyst"
        | "legal"
        | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "analyst", "user"],
      workspace_role: [
        "owner",
        "compliance_officer",
        "analyst",
        "legal",
        "viewer",
      ],
    },
  },
} as const
