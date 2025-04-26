import { createClient } from '@supabase/supabase-js'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import {
  Memory,
  MemoryType,
  MemorySearchParams,
  MemorySearchResult,
  PermissionLevel,
} from '../models/memory'
import { Database } from '../models/database.types'

export class MemoryService {
  private supabase
  private embeddings

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    })
  }

  async createMemory(
    agentId: string,
    type: MemoryType,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<Memory> {
    // Generate embedding for the content
    const embedding = await this.embeddings.embedQuery(content)

    // Insert memory
    const { data: memory, error } = await this.supabase
      .from('memories')
      .insert({
        agent_id: agentId,
        type,
        content,
        embedding,
        metadata,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create memory: ${error.message}`)

    // Grant admin access to the creating agent
    await this.grantAccess(memory.id, agentId, 'admin')

    return this.formatMemory(memory)
  }

  async searchMemories({
    queryEmbedding,
    similarityThreshold = 0.7,
    maxResults = 10,
    requestingAgentId,
  }: MemorySearchParams): Promise<MemorySearchResult[]> {
    const { data, error } = await this.supabase.rpc('search_similar_memories', {
      query_embedding: queryEmbedding,
      similarity_threshold: similarityThreshold,
      max_results: maxResults,
      requesting_agent_id: requestingAgentId,
    })

    if (error) throw new Error(`Failed to search memories: ${error.message}`)

    return data
  }

  async searchSimilarContent(
    content: string,
    requestingAgentId: string,
    similarityThreshold = 0.7,
    maxResults = 10
  ): Promise<MemorySearchResult[]> {
    const queryEmbedding = await this.embeddings.embedQuery(content)
    return this.searchMemories({
      queryEmbedding,
      similarityThreshold,
      maxResults,
      requestingAgentId,
    })
  }

  async grantAccess(
    memoryId: string,
    agentId: string,
    permissionLevel: PermissionLevel
  ): Promise<void> {
    const { error } = await this.supabase.from('memory_access_controls').insert({
      memory_id: memoryId,
      agent_id: agentId,
      permission_level: permissionLevel,
    })

    if (error) throw new Error(`Failed to grant access: ${error.message}`)
  }

  async revokeAccess(memoryId: string, agentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('memory_access_controls')
      .delete()
      .match({ memory_id: memoryId, agent_id: agentId })

    if (error) throw new Error(`Failed to revoke access: ${error.message}`)
  }

  async getMemoriesByAgent(
    agentId: string,
    type?: MemoryType
  ): Promise<Memory[]> {
    let query = this.supabase
      .from('accessible_memories')
      .select('*')
      .eq('accessing_agent_id', agentId)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) throw new Error(`Failed to get memories: ${error.message}`)

    return data.map(this.formatMemory)
  }

  private formatMemory(dbMemory: any): Memory {
    return {
      id: dbMemory.id,
      agentId: dbMemory.agent_id,
      type: dbMemory.type,
      content: dbMemory.content,
      embedding: dbMemory.embedding,
      metadata: dbMemory.metadata,
      createdAt: dbMemory.created_at,
      updatedAt: dbMemory.updated_at,
    }
  }
} 