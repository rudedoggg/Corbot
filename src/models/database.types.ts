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
      memories: {
        Row: {
          id: string
          agent_id: string
          type: 'conversation' | 'knowledge' | 'task' | 'goal'
          content: string
          embedding: number[] | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          type: 'conversation' | 'knowledge' | 'task' | 'goal'
          content: string
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          type?: 'conversation' | 'knowledge' | 'task' | 'goal'
          content?: string
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      memory_access_controls: {
        Row: {
          id: string
          memory_id: string
          agent_id: string
          permission_level: 'read' | 'write' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          agent_id: string
          permission_level: 'read' | 'write' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          agent_id?: string
          permission_level?: 'read' | 'write' | 'admin'
          created_at?: string
        }
      }
    }
    Views: {
      accessible_memories: {
        Row: {
          id: string
          agent_id: string
          type: 'conversation' | 'knowledge' | 'task' | 'goal'
          content: string
          embedding: number[] | null
          metadata: Json
          created_at: string
          updated_at: string
          permission_level: 'read' | 'write' | 'admin'
          accessing_agent_id: string
        }
      }
    }
    Functions: {
      search_similar_memories: {
        Args: {
          query_embedding: number[]
          similarity_threshold: number
          max_results: number
          requesting_agent_id: string
        }
        Returns: {
          id: string
          content: string
          similarity: number
          type: 'conversation' | 'knowledge' | 'task' | 'goal'
          metadata: Json
          created_at: string
        }[]
      }
    }
  }
} 