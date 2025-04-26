import { Database } from './database.types'

export type MemoryType = 'conversation' | 'knowledge' | 'task' | 'goal'
export type PermissionLevel = 'read' | 'write' | 'admin'

export interface Memory {
  id: string
  agentId: string
  type: MemoryType
  content: string
  embedding?: number[] // 1536-dimensional vector
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface MemoryAccessControl {
  id: string
  memoryId: string
  agentId: string
  permissionLevel: PermissionLevel
  createdAt: string
}

export interface MemorySearchParams {
  queryEmbedding: number[]
  similarityThreshold?: number
  maxResults?: number
  requestingAgentId: string
}

export interface MemorySearchResult {
  id: string
  content: string
  similarity: number
  type: MemoryType
  metadata: Record<string, any>
  createdAt: string
}

// Database type helpers
export type DbMemory = Database['public']['Tables']['memories']['Row']
export type DbMemoryInsert = Database['public']['Tables']['memories']['Insert']
export type DbMemoryUpdate = Database['public']['Tables']['memories']['Update']

export type DbMemoryAccessControl = Database['public']['Tables']['memory_access_controls']['Row']
export type DbMemoryAccessControlInsert = Database['public']['Tables']['memory_access_controls']['Insert']
export type DbMemoryAccessControlUpdate = Database['public']['Tables']['memory_access_controls']['Update'] 