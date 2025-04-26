-- Create migrations table
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sql TEXT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to execute SQL
CREATE OR REPLACE FUNCTION execute_sql(sql_text TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE sql_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 