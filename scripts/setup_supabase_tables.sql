-- Create agent_messages table for storing chat history
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add indexes for faster queries
  CONSTRAINT agent_messages_agent_user_idx UNIQUE (agent_id, user_id, timestamp)
);

-- Add index for faster conversation history queries
CREATE INDEX IF NOT EXISTS agent_messages_lookup_idx ON agent_messages (agent_id, user_id, timestamp);

-- Create agent_data table for structured data storage
CREATE TABLE IF NOT EXISTS agent_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure keys are unique per agent
  CONSTRAINT agent_data_unique_key UNIQUE (agent_id, key)
);

-- Add index for faster data lookups
CREATE INDEX IF NOT EXISTS agent_data_lookup_idx ON agent_data (agent_id, key);

-- RLS Policies for security
-- You should adjust these policies based on your access patterns
-- These are basic examples that restrict operations based on auth.uid

-- Messages Policies
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_messages' 
    AND policyname = 'Users can view their own messages'
  ) THEN
    CREATE POLICY "Users can view their own messages"
      ON agent_messages FOR SELECT
      USING (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_messages' 
    AND policyname = 'Users can insert their own messages'
  ) THEN
    CREATE POLICY "Users can insert their own messages"
      ON agent_messages FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_messages' 
    AND policyname = 'Users can update their own messages'
  ) THEN
    CREATE POLICY "Users can update their own messages"
      ON agent_messages FOR UPDATE
      USING (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_messages' 
    AND policyname = 'Users can delete their own messages'
  ) THEN
    CREATE POLICY "Users can delete their own messages"
      ON agent_messages FOR DELETE
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- Data Policies
ALTER TABLE agent_data ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_data' 
    AND policyname = 'Users can access only data for their agents'
  ) THEN
    CREATE POLICY "Users can access only data for their agents"
      ON agent_data FOR ALL
      USING (true); -- This should be refined based on your specific access control needs
  END IF;
END $$;

-- NOTE: Create service role access for the application backend
-- This allows your server-side code to bypass RLS
-- CREATE POLICY "Service role has full access" ON agent_messages FOR ALL TO service_role USING (true);
-- CREATE POLICY "Service role has full access" ON agent_data FOR ALL TO service_role USING (true); 