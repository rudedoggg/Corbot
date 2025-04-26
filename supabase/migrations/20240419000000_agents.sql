-- Create an enum for agent types
CREATE TYPE agent_type AS ENUM ('core', 'specialized', 'governance');

-- Create an enum for agent status
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'disabled');

-- Create the agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type agent_type NOT NULL,
    status agent_status NOT NULL DEFAULT 'active',
    purpose TEXT,
    model_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    parent_id UUID REFERENCES agents(id),
    UNIQUE(name)
);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_parent_id ON agents(parent_id);

-- Create a view for active agents
CREATE VIEW active_agents AS
SELECT *
FROM agents
WHERE status = 'active'; 