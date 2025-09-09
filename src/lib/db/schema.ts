export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          at: string | null
          id: string
          meta_json: Json | null
          supplier_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          at?: string | null
          id?: string
          meta_json?: Json | null
          supplier_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          at?: string | null
          id?: string
          meta_json?: Json | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          actor_id: string | null
          comment: string | null
          created_at: string | null
          decided_at: string | null
          decision: Database["public"]["Enums"]["approval_decision"] | null
          esign_name: string | null
          esign_time: string | null
          id: string
          stage: string
          supplier_id: string
        }
        Insert: {
          actor_id?: string | null
          comment?: string | null
          created_at?: string | null
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"] | null
          esign_name?: string | null
          esign_time?: string | null
          id?: string
          stage: string
          supplier_id: string
        }
        Update: {
          actor_id?: string | null
          comment?: string | null
          created_at?: string | null
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"] | null
          esign_name?: string | null
          esign_time?: string | null
          id?: string
          stage?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      changes: {
        Row: {
          closed_at: string | null
          created_at: string | null
          field: string
          id: string
          linked_capa_id: string | null
          new_value: string | null
          old_value: string | null
          opened_at: string | null
          opened_by: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          field: string
          id?: string
          linked_capa_id?: string | null
          new_value?: string | null
          old_value?: string | null
          opened_at?: string | null
          opened_by?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          field?: string
          id?: string
          linked_capa_id?: string | null
          new_value?: string | null
          old_value?: string | null
          opened_at?: string | null
          opened_by?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "changes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "changes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          expires_on: string | null
          file_hash: string | null
          file_path: string
          id: string
          issued_on: string | null
          site_id: string | null
          status: string
          supplier_id: string
          type: Database["public"]["Enums"]["doc_type"]
          uploaded_at: string | null
          uploaded_by: string | null
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          expires_on?: string | null
          file_hash?: string | null
          file_path: string
          id?: string
          issued_on?: string | null
          site_id?: string | null
          status?: string
          supplier_id: string
          type: Database["public"]["Enums"]["doc_type"]
          uploaded_at?: string | null
          uploaded_by?: string | null
          updated_at?: string | null
          version?: string
        }
        Update: {
          created_at?: string | null
          expires_on?: string | null
          file_hash?: string | null
          file_path?: string
          id?: string
          issued_on?: string | null
          site_id?: string | null
          status?: string
          supplier_id?: string
          type?: Database["public"]["Enums"]["doc_type"]
          uploaded_at?: string | null
          uploaded_by?: string | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "supplier_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          json_schema: Json
          locale: string
          version: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          json_schema: Json
          locale?: string
          version: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          json_schema?: Json
          locale?: string
          version?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          created_at: string | null
          id: string
          json: Json
          questionnaire_id: string
          submitted_at: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          json: Json
          questionnaire_id: string
          submitted_at?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          json?: Json
          questionnaire_id?: string
          submitted_at?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecards: {
        Row: {
          created_at: string | null
          grade: string
          id: string
          kpis_json: Json | null
          period_month: number
          period_year: number
          score: number
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          grade: string
          id?: string
          kpis_json?: Json | null
          period_month: number
          period_year: number
          score: number
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          grade?: string
          id?: string
          kpis_json?: Json | null
          period_month?: number
          period_year?: number
          score?: number
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecards_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contacts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role: string
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_sites: {
        Row: {
          address: string
          city: string | null
          country: string | null
          created_at: string | null
          gmp_status: string | null
          id: string
          last_audit_date: string | null
          region: string | null
          role: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          address: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          gmp_status?: string | null
          id?: string
          last_audit_date?: string | null
          region?: string | null
          role?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          gmp_status?: string | null
          id?: string
          last_audit_date?: string | null
          region?: string | null
          role?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          bn: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          dba: string | null
          id: string
          legal_name: string
          po_blocked: boolean
          risk_score: number
          status: Database["public"]["Enums"]["supplier_status"]
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at: string | null
        }
        Insert: {
          bn?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          dba?: string | null
          id?: string
          legal_name: string
          po_blocked?: boolean
          risk_score?: number
          status?: Database["public"]["Enums"]["supplier_status"]
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string | null
        }
        Update: {
          bn?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          dba?: string | null
          id?: string
          legal_name?: string
          po_blocked?: boolean
          risk_score?: number
          status?: Database["public"]["Enums"]["supplier_status"]
          type?: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          description: string | null
          due_at: string | null
          id: string
          status: string
          supplier_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          status?: string
          supplier_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          status?: string
          supplier_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          created_at: string
          date: string | null
          extra: string | null
          id: string
          latest_activity_at: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"]
          task: string
          updated_at: string
          user_id: string | null
          contact_id: string | null
          updates_count: number
        }
        Insert: {
          created_at?: string
          date?: string | null
          extra?: string | null
          id?: string
          latest_activity_at?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"]
          task?: string
          updated_at?: string
          user_id?: string | null
          contact_id?: string | null
          updates_count?: number
        }
        Update: {
          created_at?: string
          date?: string | null
          extra?: string | null
          id?: string
          latest_activity_at?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"]
          task?: string
          updated_at?: string
          user_id?: string | null
          contact_id?: string | null
          updates_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          field: string
          id: string
          message: string | null
          new_value: Json | null
          old_value: Json | null
          task_id: string
        }
        Insert: {
          action?: string
          actor?: string | null
          created_at?: string
          field?: string
          id?: string
          message?: string | null
          new_value?: Json | null
          old_value?: Json | null
          task_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          field?: string
          id?: string
          message?: string | null
          new_value?: Json | null
          old_value?: Json | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_files: {
        Row: {
          id: string
          name: string
          size_bytes: number
          task_id: string
          url: string
          uploaded_at: string
          mime_type: string | null
        }
        Insert: {
          id?: string
          name: string
          size_bytes: number
          task_id: string
          url: string
          uploaded_at?: string
          mime_type?: string | null
        }
        Update: {
          id?: string
          name?: string
          size_bytes?: number
          task_id?: string
          url?: string
          uploaded_at?: string
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_replies: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          update_id: string
        }
        Insert: {
          author: string
          body: string
          created_at?: string
          id?: string
          update_id: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_replies_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "task_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      qms_updates: {
        Row: {
          id: string;
          entity_id: string;
          module_type: string;
          author: string;
          body: string;
          created_at: string;
        }
        Insert: {
          id?: string;
          entity_id: string;
          module_type: string;
          author: string;
          body: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          entity_id?: string;
          module_type?: string;
          author?: string;
          body?: string;
          created_at?: string;
        }
        Relationships: []
      }
      qms_replies: {
        Row: {
          id: string;
          update_id: string;
          author: string;
          body: string;
          created_at: string;
        }
        Insert: {
          id?: string;
          update_id: string;
          author: string;
          body: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          update_id?: string;
          author?: string;
          body?: string;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "qms_replies_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "qms_updates"
            referencedColumns: ["id"]
          }
        ]
      }
      complaints: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["complaint_status"];
          priority: Database["public"]["Enums"]["complaint_priority"];
          reported_at: string;
          reporter_name: string | null;
          linked_capa_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          crm_contact_id: string | null;
        }
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["complaint_status"];
          priority?: Database["public"]["Enums"]["complaint_priority"];
          reported_at?: string;
          reporter_name?: string | null;
          linked_capa_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          crm_contact_id?: string | null;
        }
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["complaint_status"];
          priority?: Database["public"]["Enums"]["complaint_priority"];
          reported_at?: string;
          reporter_name?: string | null;
          linked_capa_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          crm_contact_id?: string | null;
        }
        Relationships: [
          {
            foreignKeyName: "complaints_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        }
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Relationships: []
      }
      deals: {
        Row: {
          id: string;
          title: string;
          stage: Database["public"]["Enums"]["deal_stage"];
          amount: number;
          close_date: string | null;
          contact_id: string | null;
          owner: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        }
        Insert: {
          id?: string;
          title: string;
          stage?: Database["public"]["Enums"]["deal_stage"];
          amount?: number;
          close_date?: string | null;
          contact_id?: string | null;
          owner?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          title?: string;
          stage?: Database["public"]["Enums"]["deal_stage"];
          amount?: number;
          close_date?: string | null;
          contact_id?: string | null;
          owner?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      label_specs: {
        Row: {
          id: string;
          product_id: string;
          version: number;
          status: 'draft' | 'approved' | 'retired';
          created_by: string | null;
          approved_by: string | null;
          created_at: string;
          approved_at: string | null;
          qa_approved_flag: boolean;
          qa_approved_by: string | null;
          qa_approved_at: string | null;
        }
        Insert: {
          id?: string;
          product_id: string;
          version: number;
          status?: 'draft' | 'approved' | 'retired';
          created_by?: string | null;
          approved_by?: string | null;
          created_at?: string;
          approved_at?: string | null;
          qa_approved_flag?: boolean;
          qa_approved_by?: string | null;
          qa_approved_at?: string | null;
        }
        Update: {
          id?: string;
          product_id?: string;
          version?: number;
          status?: 'draft' | 'approved' | 'retired';
          created_by?: string | null;
          approved_by?: string | null;
          created_at?: string;
          approved_at?: string | null;
          qa_approved_flag?: boolean;
          qa_approved_by?: string | null;
          qa_approved_at?: string | null;
        }
        Relationships: [
          {
            foreignKeyName: "label_specs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_specs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_specs_qa_approved_by_fkey"
            columns: ["qa_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      label_spec_content: {
        Row: {
          id: string;
          spec_id: string;
          product_name_en: string;
          product_name_fr: string;
          dosage_form: string | null;
          medicinal: Json;
          non_medicinal_en: string | null;
          non_medicinal_fr: string | null;
          claim_en: string;
          claim_fr: string;
          directions_en: string;
          directions_fr: string;
          duration_en: string | null;
          duration_fr: string | null;
          warning_en: string;
          warning_fr: string;
          storage_en: string | null;
          storage_fr: string | null;
          override_storage_flag: boolean | null;
          company_en: string | null;
          company_fr: string | null;
          company_website: string | null;
          made_in_en: string | null;
          made_in_fr: string | null;
          distributed_by_en: string | null;
          distributed_by_fr: string | null;
          npn_number: string | null;
          batch_id: string | null;
          batch_date: string | null;
          shelf_life_months: number | null;
          lot_number: string | null;
          expiry_date: string | null;
          coa_file_path: string | null;
          coa_file_name: string | null;
          override_lot_expiry_flag: boolean | null;
          risk_flags: Json | null;
          created_at: string;
          updated_at: string;
        }
        Insert: {
          id?: string;
          spec_id: string;
          product_name_en: string;
          product_name_fr: string;
          dosage_form?: string | null;
          medicinal: Json;
          non_medicinal_en?: string | null;
          non_medicinal_fr?: string | null;
          claim_en: string;
          claim_fr: string;
          directions_en: string;
          directions_fr: string;
          duration_en?: string | null;
          duration_fr?: string | null;
          warning_en: string;
          warning_fr: string;
          storage_en?: string | null;
          storage_fr?: string | null;
          override_storage_flag?: boolean | null;
          company_en?: string | null;
          company_fr?: string | null;
          company_website?: string | null;
          made_in_en?: string | null;
          made_in_fr?: string | null;
          distributed_by_en?: string | null;
          distributed_by_fr?: string | null;
          npn_number?: string | null;
          batch_id?: string | null;
          batch_date?: string | null;
          shelf_life_months?: number | null;
          lot_number?: string | null;
          expiry_date?: string | null;
          coa_file_path?: string | null;
          coa_file_name?: string | null;
          override_lot_expiry_flag?: boolean | null;
          risk_flags?: Json | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          spec_id?: string;
          product_name_en?: string;
          product_name_fr?: string;
          dosage_form?: string | null;
          medicinal?: Json;
          non_medicinal_en?: string | null;
          non_medicinal_fr?: string | null;
          claim_en?: string;
          claim_fr?: string;
          directions_en?: string;
          directions_fr?: string;
          duration_en?: string | null;
          duration_fr?: string | null;
          warning_en?: string;
          warning_fr?: string;
          storage_en?: string | null;
          storage_fr?: string | null;
          override_storage_flag?: boolean | null;
          company_en?: string | null;
          company_fr?: string | null;
          company_website?: string | null;
          made_in_en?: string | null;
          made_in_fr?: string | null;
          distributed_by_en?: string | null;
          distributed_by_fr?: string | null;
          npn_number?: string | null;
          batch_id?: string | null;
          batch_date?: string | null;
          shelf_life_months?: number | null;
          lot_number?: string | null;
          expiry_date?: string | null;
          coa_file_path?: string | null;
          coa_file_name?: string | null;
          override_lot_expiry_flag?: boolean | null;
          risk_flags?: Json | null;
          created_at?: string;
          updated_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "label_spec_content_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "label_specs"
            referencedColumns: ["id"]
          }
        ]
      }
      label_spec_activity: {
        Row: {
          id: string;
          spec_id: string;
          field: string;
          action: string;
          old_value: Json | null;
          new_value: Json | null;
          actor: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          spec_id: string;
          field: string;
          action: string;
          old_value?: Json | null;
          new_value?: Json | null;
          actor?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          spec_id?: string;
          field?: string;
          action?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          actor?: string | null;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "label_spec_activity_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_spec_activity_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "label_specs"
            referencedColumns: ["id"]
          }
        ]
      }
      batches: {
        Row: {
          id: string;
          spec_id: string | null;
          sku: string;
          lot_code: string;
          manufacturer: string;
          mfg_site: string | null;
          mfg_date: string;
          expiry_date: string | null;
          quantity: number;
          uom: string;
          disposition: Database["public"]["Enums"]["disposition"];
          owner: string | null;
          last_updated: string;
          created_at: string;
          updated_at: string;
        }
        Insert: {
          id?: string;
          spec_id?: string | null;
          sku: string;
          lot_code: string;
          manufacturer: string;
          mfg_site?: string | null;
          mfg_date: string;
          expiry_date?: string | null;
          quantity?: number;
          uom?: string;
          disposition?: Database["public"]["Enums"]["disposition"];
          owner?: string | null;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          spec_id?: string | null;
          sku?: string;
          lot_code?: string;
          manufacturer?: string;
          mfg_site?: string | null;
          mfg_date?: string;
          expiry_date?: string | null;
          quantity?: number;
          uom?: string;
          disposition?: Database["public"]["Enums"]["disposition"];
          owner?: string | null;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "batches_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "label_specs"
            referencedColumns: ["id"]
          }
        ]
      }
      batch_attributes: {
        Row: {
          id: string;
          batch_id: string;
          key: string;
          value: string;
          created_at: string;
        }
        Insert: {
          id?: string;
          batch_id: string;
          key: string;
          value: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          batch_id?: string;
          key?: string;
          value?: string;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "batch_attributes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          }
        ]
      }
      batch_tests: {
        Row: {
          id: string;
          batch_id: string;
          analyte: string;
          method: string | null;
          result: string;
          unit: string | null;
          spec_min: string | null;
          spec_max: string | null;
          pass: boolean;
          tested_on: string | null;
          lab_name: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          batch_id: string;
          analyte: string;
          method?: string | null;
          result: string;
          unit?: string | null;
          spec_min?: string | null;
          spec_max?: string | null;
          pass?: boolean;
          tested_on?: string | null;
          lab_name?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          batch_id?: string;
          analyte?: string;
          method?: string | null;
          result?: string;
          unit?: string | null;
          spec_min?: string | null;
          spec_max?: string | null;
          pass?: boolean;
          tested_on?: string | null;
          lab_name?: string | null;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "batch_tests_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          }
        ]
      }
      coa_files: {
        Row: {
          id: string;
          batch_id: string;
          file_name: string;
          storage_path: string;
          size_bytes: number;
          uploaded_by: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          batch_id: string;
          file_name: string;
          storage_path: string;
          size_bytes: number;
          uploaded_by?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          batch_id?: string;
          file_name?: string;
          storage_path?: string;
          size_bytes?: number;
          uploaded_by?: string | null;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "coa_files_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coa_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      shipments: {
        Row: {
          id: string;
          batch_id: string;
          to_party: string;
          to_address: string | null;
          shipped_on: string;
          qty: number;
          uom: string;
          reference: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          batch_id: string;
          to_party: string;
          to_address?: string | null;
          shipped_on: string;
          qty: number;
          uom?: string;
          reference?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          batch_id?: string;
          to_party?: string;
          to_address?: string | null;
          shipped_on?: string;
          qty?: number;
          uom?: string;
          reference?: string | null;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "shipments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          }
        ]
      }
      chain_events: {
        Row: {
          id: string;
          batch_id: string;
          type: Database["public"]["Enums"]["chain_event_type"];
          actor: string | null;
          detail: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          batch_id: string;
          type: Database["public"]["Enums"]["chain_event_type"];
          actor?: string | null;
          detail?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          batch_id?: string;
          type?: Database["public"]["Enums"]["chain_event_type"];
          actor?: string | null;
          detail?: string | null;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "chain_events_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_events_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          }
        ]
      }
      stability_studies: {
        Row: {
          id: string
          product_name: string
          batch_no: string
          chamber: string | null
          storage_condition: string | null
          start_date: string | null
          duration_days: number | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_name?: string
          batch_no?: string
          chamber?: string | null
          storage_condition?: string | null
          start_date?: string | null
          duration_days?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_name?: string
          batch_no?: string
          chamber?: string | null
          storage_condition?: string | null
          start_date?: string | null
          duration_days?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stability_protocols: {
        Row: {
          id: string
          study_id: string
          title: string
          product_batch: string | null
          storage_conditions: string
          pull_schedule: Json | null
          notes: string | null
          status: string | null
          start_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          study_id: string
          title: string
          product_batch?: string | null
          storage_conditions: string
          pull_schedule?: Json | null
          notes?: string | null
          status?: string | null
          start_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          study_id?: string
          title?: string
          product_batch?: string | null
          storage_conditions?: string
          pull_schedule?: Json | null
          notes?: string | null
          status?: string | null
          start_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stability_protocols_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "stability_studies"
            referencedColumns: ["id"]
          }
        ]
      }
      stability_timepoints: {
        Row: {
          id: string
          protocol_id: string
          label: string
          planned_date: string
          actual_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          protocol_id: string
          label: string
          planned_date: string
          actual_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          protocol_id?: string
          label?: string
          planned_date?: string
          actual_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stability_timepoints_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "stability_protocols"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      approval_decision: "approved" | "conditional" | "rejected"
      doc_type:
        | "GMP_CERT"
        | "INSURANCE_COI"
        | "QA_QUESTIONNAIRE"
        | "RECALL_SOP"
        | "ALLERGEN_STATEMENT"
        | "HACCP_PCP"
        | "HEAVY_METALS_POLICY"
        | "TRACEABILITY_SOP"
        | "STABILITY_POLICY"
        | "COA_SAMPLE"
        | "TAX_W8_W9"
        | "BANKING_INFO"
      supplier_status:
        | "Pending Invite"
        | "Invited"
        | "Drafting"
        | "Submitted"
        | "Under Review"
        | "Approved"
        | "Conditional"
        | "Rejected"
        | "Inactive"
      supplier_type: "manufacturer" | "packer" | "lab" | "broker" | "3PL"
      task_priority: "Critical" | "High" | "Medium" | "Low"
      task_status:
        | "Not Started"
        | "In Progress"
        | "Completed"
        | "Working on it"
        | "Stuck"
        | "Done"
        | "Pending"
      complaint_status: "Open" | "Closed" | "Under Review"
      complaint_priority: "High" | "Medium" | "Low"
      deal_stage: "New" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost"
      disposition: "Pending" | "Released" | "Quarantined" | "On Hold" | "Rejected" | "Recalled"
      chain_event_type: "Manufactured" | "Received" | "QC Sampled" | "QC Passed" | "QC Failed" | "Labeled" | "Packed" | "Shipped" | "Return" | "Destroyed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never