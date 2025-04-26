import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

async function createTestAgent() {
  try {
    console.log('Creating test agent...')
    console.log('Using Supabase URL:', process.env.SUPABASE_URL)
    
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/agents`, {
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

    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)
    console.log('Response body:', responseText)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`)
    }

    const data = JSON.parse(responseText)
    console.log('Test agent created successfully!')
    console.log('Agent data:', data)
    return data
  } catch (error) {
    console.error('Error creating test agent:', error)
    throw error
  }
}

createTestAgent()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)) 