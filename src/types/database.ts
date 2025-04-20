// src/types/database.ts

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
      artifacts: {
        Row: {
          id: string
          wallet_id: string
          token_id: string
          contract_address: string
          network: string
          title: string | null
          description: string | null
          metadata: Json | null
          media_url: string | null
          cover_image_url: string | null
          media_type: string | null
          additional_media: Json | null
          is_spam: boolean
          is_in_catalog: boolean
          created_at: string
          updated_at: string
          creator: string | null // New field
          contract_name: string | null // New field
        }
        Insert: {
          id?: string
          wallet_id: string
          token_id: string
          contract_address: string
          network: string
          title?: string | null
          description?: string | null
          metadata?: Json | null
          media_url?: string | null
          cover_image_url?: string | null
          media_type?: string | null
          additional_media?: Json | null
          is_spam?: boolean
          is_in_catalog?: boolean
          created_at?: string
          updated_at?: string
          creator?: string | null
          contract_name?: string | null
        }
        Update: {
          id?: string
          wallet_id?: string
          token_id?: string
          contract_address?: string
          network?: string
          title?: string | null
          description?: string | null
          metadata?: Json | null
          media_url?: string | null
          cover_image_url?: string | null
          media_type?: string | null
          additional_media?: Json | null
          is_spam?: boolean
          is_in_catalog?: boolean
          created_at?: string
          updated_at?: string
          creator?: string | null
          contract_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_wallet_id_fkey"
            columns: ["wallet_id"]
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          contact_email: string | null // New field
          auth_method: string | null // New field
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          contact_email?: string | null
          auth_method?: string | null
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          contact_email?: string | null
          auth_method?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          address: string
          nickname: string | null
          type: string
          networks: string[]
          created_at: string
          updated_at: string
          last_refreshed: string | null
        }
        Insert: {
          id?: string
          user_id: string
          address: string
          nickname?: string | null
          type?: string
          networks?: string[]
          created_at?: string
          updated_at?: string
          last_refreshed?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          address?: string
          nickname?: string | null
          type?: string
          networks?: string[]
          created_at?: string
          updated_at?: string
          last_refreshed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      catalogs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      catalog_artifacts: {
        Row: {
          id: string
          catalog_id: string
          artifact_id: string
          created_at: string
        }
        Insert: {
          id?: string
          catalog_id: string
          artifact_id: string
          created_at?: string
        }
        Update: {
          id?: string
          catalog_id?: string
          artifact_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_artifacts_artifact_id_fkey"
            columns: ["artifact_id"]
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_artifacts_catalog_id_fkey"
            columns: ["catalog_id"]
            referencedRelation: "catalogs"
            referencedColumns: ["id"]
          }
        ]
      }
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      catalog_folders: {
        Row: {
          id: string
          catalog_id: string
          folder_id: string
          created_at: string
        }
        Insert: {
          id?: string
          catalog_id: string
          folder_id: string
          created_at?: string
        }
        Update: {
          id?: string
          catalog_id?: string
          folder_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_folders_catalog_id_fkey"
            columns: ["catalog_id"]
            referencedRelation: "catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_folders_folder_id_fkey"
            columns: ["folder_id"]
            referencedRelation: "folders"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}