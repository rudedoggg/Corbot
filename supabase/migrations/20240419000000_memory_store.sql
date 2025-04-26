-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create an enum for memory types
CREATE TYPE memory_type AS ENUM ('conversation', 'knowledge', 'task', 'goal');

-- Create the memories table with vector storage
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL,
    type memory_type NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- Using 1536 dimensions for OpenAI embeddings
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Add indexes for better query performance
    CONSTRAINT fk_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create a GiST index for faster similarity searches
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a table for memory access control
CREATE TABLE memory_access_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(memory_id, agent_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_memories_agent_id ON memories(agent_id);
CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_created_at ON memories(created_at);
CREATE INDEX idx_memory_access_memory_id ON memory_access_controls(memory_id);
CREATE INDEX idx_memory_access_agent_id ON memory_access_controls(agent_id);

-- Create a view for easy access to memories with permissions
CREATE VIEW accessible_memories AS
SELECT 
    m.*,
    mac.permission_level,
    mac.agent_id as accessing_agent_id
FROM 
    memories m
    JOIN memory_access_controls mac ON m.id = mac.memory_id;

-- Function to search similar memories
CREATE OR REPLACE FUNCTION search_similar_memories(
    query_embedding vector(1536),
    similarity_threshold float,
    max_results integer,
    requesting_agent_id UUID
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity float,
    type memory_type,
    metadata JSONB,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        1 - (m.embedding <=> query_embedding) as similarity,
        m.type,
        m.metadata,
        m.created_at
    FROM 
        memories m
        JOIN memory_access_controls mac ON m.id = mac.memory_id
    WHERE 
        mac.agent_id = requesting_agent_id
        AND mac.permission_level IN ('read', 'admin')
        AND 1 - (m.embedding <=> query_embedding) > similarity_threshold
    ORDER BY 
        m.embedding <=> query_embedding
    LIMIT max_results;
END;
$$; 