require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function setupMigrationsTable() {
  try {
    console.log('Setting up migrations table...')
    
    const { error } = await supabase.rpc('create_migrations_table')
    
    if (error) {
      console.error('Error creating migrations table:', error)
      throw error
    }

    console.log('Migrations table created successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

setupMigrationsTable() 