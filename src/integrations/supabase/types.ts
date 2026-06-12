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
      achievements: {
        Row: {
          active: boolean
          category: string
          code: string
          created_at: string
          criteria: Json
          description: string
          icon: string | null
          id: string
          points: number
          tier: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          code: string
          created_at?: string
          criteria?: Json
          description: string
          icon?: string | null
          id?: string
          points?: number
          tier?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string | null
          id?: string
          points?: number
          tier?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          paid_at: string | null
          reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          paid_at?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          paid_at?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string
          audience_filter: Json
          body: string
          category: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          media_url: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          audience_filter?: Json
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          media_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          audience_filter?: Json
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          media_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      audit_records: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          name: string
          run_count: number
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name: string
          run_count?: number
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name?: string
          run_count?: number
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          payload: Json
          result: Json
          rule_id: string
          status: string
          trigger: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          payload?: Json
          result?: Json
          rule_id: string
          status?: string
          trigger: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          payload?: Json
          result?: Json
          rule_id?: string
          status?: string
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          joined_at: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "messaging_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_messages: {
        Row: {
          attachments: Json
          channel_id: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          mentions: string[]
          sender_id: string
        }
        Insert: {
          attachments?: Json
          channel_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          mentions?: string[]
          sender_id: string
        }
        Update: {
          attachments?: Json
          channel_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          mentions?: string[]
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "messaging_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          active: boolean
          created_at: string
          event_type: string
          fixed_amount: number
          id: string
          level: number
          minimum_amount: number
          name: string
          percentage: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_type: string
          fixed_amount?: number
          id?: string
          level?: number
          minimum_amount?: number
          name: string
          percentage?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_type?: string
          fixed_amount?: number
          id?: string
          level?: number
          minimum_amount?: number
          name?: string
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          beneficiary_id: string
          created_at: string
          currency: string
          event_type: string
          id: string
          level: number
          metadata: Json
          reference: string | null
          rule_id: string | null
          source_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          beneficiary_id: string
          created_at?: string
          currency?: string
          event_type: string
          id?: string
          level?: number
          metadata?: Json
          reference?: string | null
          rule_id?: string | null
          source_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          beneficiary_id?: string
          created_at?: string
          currency?: string
          event_type?: string
          id?: string
          level?: number
          metadata?: Json
          reference?: string | null
          rule_id?: string | null
          source_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_cases: {
        Row: {
          assigned_to: string | null
          case_type: string
          created_at: string
          description: string | null
          id: string
          opened_by: string | null
          resolution: string | null
          resolved_at: string | null
          risk_flags: string[]
          severity: string
          status: string
          subject_user_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_type: string
          created_at?: string
          description?: string | null
          id?: string
          opened_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          risk_flags?: string[]
          severity?: string
          status?: string
          subject_user_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_type?: string
          created_at?: string
          description?: string | null
          id?: string
          opened_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          risk_flags?: string[]
          severity?: string
          status?: string
          subject_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          dial_code: string | null
          flag: string | null
          name: string
        }
        Insert: {
          code: string
          dial_code?: string | null
          flag?: string | null
          name: string
        }
        Update: {
          code?: string
          dial_code?: string | null
          flag?: string | null
          name?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          lead_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          converted_at: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          lifecycle_stage: string
          next_followup_at: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          tags: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          converted_at?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lifecycle_stage?: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          converted_at?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lifecycle_stage?: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crypto_deposit_addresses: {
        Row: {
          address: string
          asset: string
          assigned_by: string | null
          created_at: string
          id: string
          is_active: boolean
          memo: string | null
          network: string
          user_id: string
        }
        Insert: {
          address: string
          asset: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          memo?: string | null
          network: string
          user_id: string
        }
        Update: {
          address?: string
          asset?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          memo?: string | null
          network?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          bucket: string
          document_name: string
          document_type: string
          file_url: string
          id: string
          size_bytes: number | null
          uploaded_at: string
          uploaded_by: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          bucket?: string
          document_name: string
          document_type: string
          file_url: string
          id?: string
          size_bytes?: number | null
          uploaded_at?: string
          uploaded_by?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          bucket?: string
          document_name?: string
          document_type?: string
          file_url?: string
          id?: string
          size_bytes?: number | null
          uploaded_at?: string
          uploaded_by?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      funding_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          asset: string
          completed_at: string | null
          compliance_notes: string | null
          compliance_reviewed_at: string | null
          compliance_reviewed_by: string | null
          created_at: string
          currency: string
          destination_address: string | null
          details: Json
          id: string
          network: string | null
          payment_method: string
          proof_url: string | null
          reference_number: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          sent_at: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          workflow_stage: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          asset?: string
          completed_at?: string | null
          compliance_notes?: string | null
          compliance_reviewed_at?: string | null
          compliance_reviewed_by?: string | null
          created_at?: string
          currency?: string
          destination_address?: string | null
          details?: Json
          id?: string
          network?: string | null
          payment_method: string
          proof_url?: string | null
          reference_number?: string | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          workflow_stage?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          asset?: string
          completed_at?: string | null
          compliance_notes?: string | null
          compliance_reviewed_at?: string | null
          compliance_reviewed_by?: string | null
          created_at?: string
          currency?: string
          destination_address?: string | null
          details?: Json
          id?: string
          network?: string | null
          payment_method?: string
          proof_url?: string | null
          reference_number?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          workflow_stage?: string
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          published: boolean
          slug: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          published?: boolean
          slug: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          published?: boolean
          slug?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      investment_allocations: {
        Row: {
          allocated_by: string | null
          allocation_date: string
          allocation_notes: string | null
          created_at: string
          id: string
          investment_id: string
        }
        Insert: {
          allocated_by?: string | null
          allocation_date?: string
          allocation_notes?: string | null
          created_at?: string
          id?: string
          investment_id: string
        }
        Update: {
          allocated_by?: string | null
          allocation_date?: string
          allocation_notes?: string | null
          created_at?: string
          id?: string
          investment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_allocations_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_opportunities: {
        Row: {
          available_shares: number
          category: string
          close_date: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          end_date: string | null
          expected_roi: number | null
          faq: Json
          featured: boolean
          full_description: string | null
          gallery_images: Json
          highlights: Json
          id: string
          industry: string | null
          investment_type: string
          investor_count: number
          maximum_investment: number | null
          minimum_investment: number
          open_date: string | null
          price_per_share: number
          published_at: string | null
          raised_amount: number
          risk_level: string | null
          short_description: string | null
          slug: string | null
          start_date: string | null
          status: string
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          available_shares?: number
          category?: string
          close_date?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          end_date?: string | null
          expected_roi?: number | null
          faq?: Json
          featured?: boolean
          full_description?: string | null
          gallery_images?: Json
          highlights?: Json
          id?: string
          industry?: string | null
          investment_type?: string
          investor_count?: number
          maximum_investment?: number | null
          minimum_investment?: number
          open_date?: string | null
          price_per_share?: number
          published_at?: string | null
          raised_amount?: number
          risk_level?: string | null
          short_description?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string
          target_amount?: number
          title: string
          updated_at?: string
        }
        Update: {
          available_shares?: number
          category?: string
          close_date?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          end_date?: string | null
          expected_roi?: number | null
          faq?: Json
          featured?: boolean
          full_description?: string | null
          gallery_images?: Json
          highlights?: Json
          id?: string
          industry?: string | null
          investment_type?: string
          investor_count?: number
          maximum_investment?: number | null
          minimum_investment?: number
          open_date?: string | null
          price_per_share?: number
          published_at?: string | null
          raised_amount?: number
          risk_level?: string | null
          short_description?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          approval_status: string
          created_at: string
          id: string
          investor_id: string
          opportunity_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shares: number
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approval_status?: string
          created_at?: string
          id?: string
          investor_id: string
          opportunity_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shares?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approval_status?: string
          created_at?: string
          id?: string
          investor_id?: string
          opportunity_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shares?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "investment_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_points: {
        Row: {
          level_tier: number
          lifetime_points: number
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          level_tier?: number
          lifetime_points?: number
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          level_tier?: number
          lifetime_points?: number
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_segments: {
        Row: {
          created_at: string
          created_by: string | null
          definition: Json
          description: string | null
          id: string
          last_computed_at: string | null
          member_count: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          definition?: Json
          description?: string | null
          id?: string
          last_computed_at?: string | null
          member_count?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          definition?: Json
          description?: string | null
          id?: string
          last_computed_at?: string | null
          member_count?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          currency: string
          description: string | null
          due_at: string | null
          funding_request_id: string | null
          id: string
          invoice_number: string
          kind: string
          metadata: Json
          paid_at: string | null
          payment_method: string | null
          source_id: string
          source_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_at?: string | null
          funding_request_id?: string | null
          id?: string
          invoice_number: string
          kind: string
          metadata?: Json
          paid_at?: string | null
          payment_method?: string | null
          source_id: string
          source_type: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_at?: string | null
          funding_request_id?: string | null
          id?: string
          invoice_number?: string
          kind?: string
          metadata?: Json
          paid_at?: string | null
          payment_method?: string | null
          source_id?: string
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_funding_request_id_fkey"
            columns: ["funding_request_id"]
            isOneToOne: false
            referencedRelation: "funding_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string
          storage_path: string
          submission_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          storage_path: string
          submission_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          storage_path?: string
          submission_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "kyc_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          address: string | null
          date_of_birth: string | null
          document_type: string | null
          document_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          nationality: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          selfie_url: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          date_of_birth?: string | null
          document_type?: string | null
          document_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          nationality?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          date_of_birth?: string | null
          document_type?: string | null
          document_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          nationality?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          id: string
          identifier: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          id?: string
          identifier: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          id?: string
          identifier?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "channel_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_channels: {
        Row: {
          channel_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string | null
        }
        Insert: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          id: string
          metadata: Json | null
          status: string
          subject: string | null
          template: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          channel: string
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          subject?: string | null
          template?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          subject?: string | null
          template?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          category: string
          email: boolean
          in_app: boolean
          push: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          email?: boolean
          in_app?: boolean
          push?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          email?: boolean
          in_app?: boolean
          push?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          archived: boolean
          category: string | null
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json
          notification_type: string
          read_status: boolean
          title: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json
          notification_type?: string
          read_status?: boolean
          title: string
          user_id: string
        }
        Update: {
          archived?: boolean
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json
          notification_type?: string
          read_status?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunity_documents: {
        Row: {
          bucket: string
          created_at: string
          document_name: string
          document_type: string
          file_url: string
          id: string
          opportunity_id: string
          size_bytes: number | null
          uploaded_by: string | null
          visibility: string
        }
        Insert: {
          bucket?: string
          created_at?: string
          document_name: string
          document_type: string
          file_url: string
          id?: string
          opportunity_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
          visibility?: string
        }
        Update: {
          bucket?: string
          created_at?: string
          document_name?: string
          document_type?: string
          file_url?: string
          id?: string
          opportunity_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_documents_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "investment_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          team: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          team?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          team?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          country: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_verified: boolean
          first_name: string | null
          id: string
          kyc_status: Database["public"]["Enums"]["verification_status"]
          language: string | null
          last_name: string | null
          locale: string
          marketing_opt_in: boolean
          phone: string | null
          phone_verified: boolean
          preferred_currency: string | null
          referral_code: string | null
          referred_by: string | null
          suspended_at: string | null
          suspended_reason: string | null
          timezone: string | null
          two_factor_enabled: boolean
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          first_name?: string | null
          id: string
          kyc_status?: Database["public"]["Enums"]["verification_status"]
          language?: string | null
          last_name?: string | null
          locale?: string
          marketing_opt_in?: boolean
          phone?: string | null
          phone_verified?: boolean
          preferred_currency?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          first_name?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["verification_status"]
          language?: string | null
          last_name?: string | null
          locale?: string
          marketing_opt_in?: boolean
          phone?: string | null
          phone_verified?: boolean
          preferred_currency?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_records: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          difference_amount: number
          expected_amount: number | null
          funding_request_id: string | null
          id: string
          ledger_id: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string | null
          source_type: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          difference_amount?: number
          expected_amount?: number | null
          funding_request_id?: string | null
          id?: string
          ledger_id?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          source_type: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          difference_amount?: number
          expected_amount?: number | null
          funding_request_id?: string | null
          id?: string
          ledger_id?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_records_funding_request_id_fkey"
            columns: ["funding_request_id"]
            isOneToOne: false
            referencedRelation: "funding_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_records_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_records_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          code: string
          converted: boolean
          created_at: string
          id: string
          ip_hash: string | null
          referer: string | null
          referrer_id: string | null
          user_agent: string | null
        }
        Insert: {
          code: string
          converted?: boolean
          created_at?: string
          id?: string
          ip_hash?: string | null
          referer?: string | null
          referrer_id?: string | null
          user_agent?: string | null
        }
        Update: {
          code?: string
          converted?: boolean
          created_at?: string
          id?: string
          ip_hash?: string | null
          referer?: string | null
          referrer_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number
          created_at: string
          currency: string
          event_type: string
          id: string
          notes: string | null
          referral_id: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          event_type: string
          id?: string
          notes?: string | null
          referral_id?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          event_type?: string
          id?: string
          notes?: string | null
          referral_id?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      report_runs: {
        Row: {
          bucket: string | null
          created_at: string
          file_url: string | null
          filters: Json
          format: string
          generated_by: string | null
          id: string
          report_type: string
          row_count: number | null
          scheduled_report_id: string | null
          status: string
        }
        Insert: {
          bucket?: string | null
          created_at?: string
          file_url?: string | null
          filters?: Json
          format: string
          generated_by?: string | null
          id?: string
          report_type: string
          row_count?: number | null
          scheduled_report_id?: string | null
          status?: string
        }
        Update: {
          bucket?: string | null
          created_at?: string
          file_url?: string | null
          filters?: Json
          format?: string
          generated_by?: string | null
          id?: string
          report_type?: string
          row_count?: number | null
          scheduled_report_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_runs_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_levels: {
        Row: {
          benefits: Json
          color: string | null
          created_at: string
          id: string
          min_points: number
          name: string
          tier: number
        }
        Insert: {
          benefits?: Json
          color?: string | null
          created_at?: string
          id?: string
          min_points?: number
          name: string
          tier: number
        }
        Update: {
          benefits?: Json
          color?: string | null
          created_at?: string
          id?: string
          min_points?: number
          name?: string
          tier?: number
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          meta: Json
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          meta?: Json
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          meta?: Json
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          filters: Json
          format: string
          id: string
          last_run_at: string | null
          last_status: string | null
          recipients: Json
          report_type: string
          schedule: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          filters?: Json
          format?: string
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          recipients?: Json
          report_type: string
          schedule: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          filters?: Json
          format?: string
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          recipients?: Json
          report_type?: string
          schedule?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          event_type: Database["public"]["Enums"]["security_event_type"]
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          event_type: Database["public"]["Enums"]["security_event_type"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          event_type?: Database["public"]["Enums"]["security_event_type"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      spacex_holdings: {
        Row: {
          average_cost: number
          created_at: string
          id: string
          realized_pl: number
          shares: number
          symbol: string
          total_invested: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_cost?: number
          created_at?: string
          id?: string
          realized_pl?: number
          shares?: number
          symbol?: string
          total_invested?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_cost?: number
          created_at?: string
          id?: string
          realized_pl?: number
          shares?: number
          symbol?: string
          total_invested?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spacex_orders: {
        Row: {
          amount: number
          created_at: string
          fee: number
          id: string
          notes: string | null
          payment_method: string
          price: number
          shares: number
          side: string
          status: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee?: number
          id?: string
          notes?: string | null
          payment_method?: string
          price: number
          shares: number
          side?: string
          status?: string
          symbol?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          notes?: string | null
          payment_method?: string
          price?: number
          shares?: number
          side?: string
          status?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spacex_quotes: {
        Row: {
          company_name: string
          day_high: number | null
          day_low: number | null
          market_cap: number | null
          previous_close: number | null
          price: number
          symbol: string
          updated_at: string
          week52_high: number | null
          week52_low: number | null
        }
        Insert: {
          company_name: string
          day_high?: number | null
          day_low?: number | null
          market_cap?: number | null
          previous_close?: number | null
          price: number
          symbol: string
          updated_at?: string
          week52_high?: number | null
          week52_low?: number | null
        }
        Update: {
          company_name?: string
          day_high?: number | null
          day_low?: number | null
          market_cap?: number | null
          previous_close?: number | null
          price?: number
          symbol?: string
          updated_at?: string
          week52_high?: number | null
          week52_low?: number | null
        }
        Relationships: []
      }
      staff_notes: {
        Row: {
          archived: boolean
          author_id: string
          content: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          mentions: Json
          pinned: boolean
          title: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          archived?: boolean
          author_id: string
          content: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          mentions?: Json
          pinned?: boolean
          title?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          archived?: boolean
          author_id?: string
          content?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          mentions?: Json
          pinned?: boolean
          title?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tesla_holdings: {
        Row: {
          average_cost: number
          created_at: string
          id: string
          realized_pl: number
          shares: number
          symbol: string
          total_invested: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_cost?: number
          created_at?: string
          id?: string
          realized_pl?: number
          shares?: number
          symbol?: string
          total_invested?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_cost?: number
          created_at?: string
          id?: string
          realized_pl?: number
          shares?: number
          symbol?: string
          total_invested?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tesla_orders: {
        Row: {
          amount: number
          created_at: string
          fee: number
          id: string
          notes: string | null
          payment_method: string
          price: number
          shares: number
          side: string
          status: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee?: number
          id?: string
          notes?: string | null
          payment_method?: string
          price: number
          shares: number
          side?: string
          status?: string
          symbol?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          notes?: string | null
          payment_method?: string
          price?: number
          shares?: number
          side?: string
          status?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tesla_quotes: {
        Row: {
          company_name: string
          day_high: number | null
          day_low: number | null
          market_cap: number | null
          previous_close: number | null
          price: number
          symbol: string
          updated_at: string
          week52_high: number | null
          week52_low: number | null
        }
        Insert: {
          company_name: string
          day_high?: number | null
          day_low?: number | null
          market_cap?: number | null
          previous_close?: number | null
          price: number
          symbol: string
          updated_at?: string
          week52_high?: number | null
          week52_low?: number | null
        }
        Update: {
          company_name?: string
          day_high?: number | null
          day_low?: number | null
          market_cap?: number | null
          previous_close?: number | null
          price?: number
          symbol?: string
          updated_at?: string
          week52_high?: number | null
          week52_low?: number | null
        }
        Relationships: []
      }
      tesla_vehicle_orders: {
        Row: {
          amount_paid: number
          base_price: number
          configuration: Json
          created_at: string
          delivery_address: string | null
          delivery_date: string | null
          deposit_amount: number
          id: string
          options_total: number
          order_type: string
          payment_method: string
          status: string
          total_price: number
          tracking_notes: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          amount_paid?: number
          base_price: number
          configuration?: Json
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          deposit_amount?: number
          id?: string
          options_total?: number
          order_type: string
          payment_method?: string
          status?: string
          total_price: number
          tracking_notes?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          amount_paid?: number
          base_price?: number
          configuration?: Json
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          deposit_amount?: number
          id?: string
          options_total?: number
          order_type?: string
          payment_method?: string
          status?: string
          total_price?: number
          tracking_notes?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tesla_vehicle_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "tesla_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      tesla_vehicles: {
        Row: {
          acceleration_sec: number | null
          active: boolean
          base_price: number
          battery_kwh: number | null
          battery_options: Json
          colors: Json
          created_at: string
          delivery_estimate: string | null
          description: string | null
          display_order: number
          features: Json
          gallery: Json
          hero_image: string | null
          id: string
          interiors: Json
          inventory: number
          model: string
          performance_options: Json
          range_miles: number | null
          slug: string
          tagline: string | null
          top_speed_mph: number | null
          updated_at: string
          wheels: Json
        }
        Insert: {
          acceleration_sec?: number | null
          active?: boolean
          base_price: number
          battery_kwh?: number | null
          battery_options?: Json
          colors?: Json
          created_at?: string
          delivery_estimate?: string | null
          description?: string | null
          display_order?: number
          features?: Json
          gallery?: Json
          hero_image?: string | null
          id?: string
          interiors?: Json
          inventory?: number
          model: string
          performance_options?: Json
          range_miles?: number | null
          slug: string
          tagline?: string | null
          top_speed_mph?: number | null
          updated_at?: string
          wheels?: Json
        }
        Update: {
          acceleration_sec?: number | null
          active?: boolean
          base_price?: number
          battery_kwh?: number | null
          battery_options?: Json
          colors?: Json
          created_at?: string
          delivery_estimate?: string | null
          description?: string | null
          display_order?: number
          features?: Json
          gallery?: Json
          hero_image?: string | null
          id?: string
          interiors?: Json
          inventory?: number
          model?: string
          performance_options?: Json
          range_miles?: number | null
          slug?: string
          tagline?: string | null
          top_speed_mph?: number | null
          updated_at?: string
          wheels?: Json
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          awarded_at: string
          id: string
          metadata: Json
          progress: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          awarded_at?: string
          id?: string
          metadata?: Json
          progress?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          awarded_at?: string
          id?: string
          metadata?: Json
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string
          device_name: string | null
          id: string
          ip_address: string | null
          last_seen_at: string
          os: string | null
          trusted: boolean
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          os?: string | null
          trusted?: boolean
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          os?: string | null
          trusted?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          marketing: boolean
          notify_email: boolean
          notify_in_app: boolean
          notify_push: boolean
          notify_sms: boolean
          product_updates: boolean
          security_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          marketing?: boolean
          notify_email?: boolean
          notify_in_app?: boolean
          notify_push?: boolean
          notify_sms?: boolean
          product_updates?: boolean
          security_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          marketing?: boolean
          notify_email?: boolean
          notify_in_app?: boolean
          notify_push?: boolean
          notify_sms?: boolean
          product_updates?: boolean
          security_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          reference: string | null
          status: string
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          status?: string
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          status?: string
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_achievement: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
      award_commissions: {
        Args: {
          _base_amount: number
          _event: string
          _ref?: string
          _user_id: string
        }
        Returns: undefined
      }
      debit_wallet_atomic: {
        Args: { _amount: number; _user_id: string; _wallet_id: string }
        Returns: {
          balance_after: number
          balance_before: number
          currency: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_channel_member: {
        Args: { _channel: string; _user: string }
        Returns: boolean
      }
      next_invoice_number: { Args: { _kind: string }; Returns: string }
      pay_commission: { Args: { _commission_id: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "visitor"
        | "registered"
        | "verified"
        | "vip"
        | "employee"
        | "support"
        | "admin"
        | "super_admin"
        | "compliance"
        | "finance"
      security_event_type:
        | "login_success"
        | "login_failed"
        | "logout"
        | "password_changed"
        | "password_reset_requested"
        | "email_changed"
        | "phone_changed"
        | "2fa_enabled"
        | "2fa_disabled"
        | "2fa_challenge_success"
        | "2fa_challenge_failed"
        | "account_locked"
        | "suspicious_activity"
        | "device_added"
        | "session_revoked"
        | "email_verified"
        | "phone_verified"
      verification_status: "pending" | "verified" | "rejected"
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
      app_role: [
        "visitor",
        "registered",
        "verified",
        "vip",
        "employee",
        "support",
        "admin",
        "super_admin",
        "compliance",
        "finance",
      ],
      security_event_type: [
        "login_success",
        "login_failed",
        "logout",
        "password_changed",
        "password_reset_requested",
        "email_changed",
        "phone_changed",
        "2fa_enabled",
        "2fa_disabled",
        "2fa_challenge_success",
        "2fa_challenge_failed",
        "account_locked",
        "suspicious_activity",
        "device_added",
        "session_revoked",
        "email_verified",
        "phone_verified",
      ],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
