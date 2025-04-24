/**
 * Corbot Framework
 * Main entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import core components
const Agent = require('./core/Agent');
const MemoryService = require('./services/MemoryService');
const LLMService = require('./services/LLMService');

// Import routes (to be created later)
// const authRoutes = require('./routes/auth');
// const chatRoutes = require('./routes/chat');

// Configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corbot';

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create main Corbot agent
let corbotAgent = null;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize main Corbot agent
    initializeCorbot();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Initialize the main Corbot agent
 */
async function initializeCorbot() {
  // Create memory service
  const memory = new MemoryService({
    agentId: 'corbot-main',
    encryptionKey: process.env.MEMORY_ENCRYPTION_KEY
  });
  
  // Create LLM service
  const llm = new LLMService({
    defaultProvider: 'openai',
    defaultModel: process.env.DEFAULT_LLM_MODEL || 'gpt-3.5-turbo'
  });
  
  // Create main agent
  corbotAgent = new Agent({
    id: 'corbot-main',
    name: 'Corbot',
    description: 'Your personal AI assistant',
    memory: memory,
    longTermPurpose: 'Assist users with their tasks and answer questions'
  });
  
  // Initialize agent
  await corbotAgent.init();
  
  console.log(`Corbot initialized with ID: ${corbotAgent.id}`);
}

// API Routes

// Status endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Corbot Framework is running',
    agent: corbotAgent ? {
      id: corbotAgent.id,
      name: corbotAgent.name,
      status: corbotAgent.status
    } : null
  });
});

// Chat endpoint (simple version for testing)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!corbotAgent) {
      return res.status(503).json({ error: 'Corbot is not initialized yet' });
    }
    
    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }
    
    const response = await corbotAgent.processMessage(message, userId);
    
    res.json({ response });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Corbot Framework running on port ${PORT}`);
}); 