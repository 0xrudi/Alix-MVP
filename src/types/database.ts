export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          address: string
          nickname: string | null
          type: 'evm' | 'solana'
          networks: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          address: string
          nickname?: string | null
          type: 'evm' | 'solana'
          networks?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          address?: string
          nickname?: string | null
          type?: 'evm' | 'solana'
          networks?: Json
          created_at?: string
          updated_at?: string
        }
      }
      artifacts: {
        Row: {
          id: string
          wallet_id: string
          token_id: string
          contract_address: string
          network: string
          metadata: Json
          title: string | null
          description: string | null
          media_url: string | null
          cover_image_url: string | null
          media_type: string | null
          additional_media: Json | null
          is_spam: boolean
          is_in_catalog: boolean;
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          token_id: string
          contract_address: string
          network: string
          metadata?: Json
          title?: string | null
          description?: string | null
          media_url?: string | null
          cover_image_url?: string | null
          media_type?: string | null
          additional_media?: Json | null
          is_spam?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          token_id?: string
          contract_address?: string
          network?: string
          metadata?: Json
          title?: string | null
          description?: string | null
          media_url?: string | null
          cover_image_url?: string | null
          media_type?: string | null
          additional_media?: Json | null
          is_spam?: boolean
          created_at?: string
          updated_at?: string
        }
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
      }
      catalog_folders: {
        Row: {
          catalog_id: string
          folder_id: string
          created_at: string
        }
        Insert: {
          catalog_id: string
          folder_id: string
          created_at?: string
        }
        Update: {
          catalog_id?: string
          folder_id?: string
          created_at?: string
        }
      }
      catalog_artifacts: {
        Row: {
          catalog_id: string
          artifact_id: string
          created_at: string
        }
        Insert: {
          catalog_id: string
          artifact_id: string
          created_at?: string
        }
        Update: {
          catalog_id?: string
          artifact_id?: string
          created_at?: string
        }
      }
    }
  }
}