import dotenv from 'dotenv'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function executeSql(sql) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      sql_text: sql
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`SQL execution failed: ${JSON.stringify(error)}`)
  }

  return response.json()
}

async function applyMigrations() {
  try {
    console.log('Applying migrations...')

    // Read migration files
    const setupMigration = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20240419000000_setup_migrations.sql'),
      'utf8'
    )
    const agentsMigration = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20240419000000_agents.sql'),
      'utf8'
    )
    const memoryMigration = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20240419000000_memory_store.sql'),
      'utf8'
    )

    // Apply setup migration first
    console.log('Setting up migrations infrastructure...')
    await executeSql(setupMigration)

    // Apply agents migration
    console.log('Creating agents table and related objects...')
    await executeSql(agentsMigration)

    // Apply memory migration
    console.log('Creating memory store tables and related objects...')
    await executeSql(memoryMigration)

    // Create test agent using REST API
    console.log('Creating test agent...')
    const agentResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'TestAgent',
        type: 'core',
        purpose: 'Testing memory functionality',
        model_config: { model: 'gpt-3.5-turbo' }
      })
    })

    if (!agentResponse.ok) {
      const error = await agentResponse.json()
      throw new Error(`Failed to create test agent: ${JSON.stringify(error)}`)
    }

    const agent = await agentResponse.json()
    console.log('Migrations applied successfully!')
    console.log('Test agent created with ID:', agent[0].id)
    
    return agent[0]
  } catch (error) {
    console.error('Error applying migrations:', error)
    throw error
  }
}

// Run migrations
applyMigrations()
  .then((agent) => {
    console.log('Setup complete! You can now use the memory store with agent ID:', agent.id)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  }) 