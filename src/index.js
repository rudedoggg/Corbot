/**
 * Corbot
 * Main entry point
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import core components
import { ChatAgent } from './core/ChatAgent.js';
import SupabaseMemoryService from './services/memory/SupabaseMemoryService.js';
import InMemoryService from './services/memory/InMemoryService.js';
import LLMService from './services/llm/LLMService.js';
import { errorHandler } from './utils/errors.js';

// Import routes
import authRoutes from './routes/auth.js';
import { router as chatRouter, setAgent } from './routes/chat.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;
const USE_IN_MEMORY = process.env.USE_IN_MEMORY_DB === 'true';

// Initialize Express app
const app = express();

// Create main Corbot agent
let corbotAgent = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRouter);

// Initialize Corbot
if (USE_IN_MEMORY) {
  console.log('Using in-memory storage (no persistence)');
  initializeCorbot(null);
} else {
  // Initialize with Supabase storage
  initializeCorbot();
}

/**
 * Initialize the main Corbot agent
 */
async function initializeCorbot(memoryService = null) {
  try {
    // Create memory service
    const memory = USE_IN_MEMORY 
      ? new InMemoryService({ agentId: 'corbot-main' })
      : new SupabaseMemoryService({
          agentId: 'corbot-main',
          encryptionKey: process.env.MEMORY_ENCRYPTION_KEY
        });
    
    // Create LLM service if OpenAI key exists
    let llm = null;
    if (process.env.OPENAI_API_KEY) {
      llm = new LLMService({
        defaultProvider: 'openai',
        defaultModel: process.env.DEFAULT_LLM_MODEL || 'gpt-3.5-turbo'
      });
    } else {
      console.log('OpenAI API key not found. LLM integration will be disabled.');
    }
    
    // Create main agent
    corbotAgent = new ChatAgent({
      id: 'corbot-main',
      name: 'Corbot',
      description: 'Your personal AI assistant',
      memory,
      llm,
      longTermPurpose: 'Assist users with their tasks and answer questions',
      defaultLLM: process.env.DEFAULT_LLM_MODEL || 'gpt-3.5-turbo'
    });
    
    // Initialize agent
    await corbotAgent.init();
    
    // Set agent reference for chat routes
    setAgent(corbotAgent);
    
    console.log(`Corbot initialized with ID: ${corbotAgent.id}`);
    console.log(`Persistent memory: ${!USE_IN_MEMORY}`);
    console.log(`LLM integration: ${llm ? 'Enabled' : 'Disabled'}`);
    
    // Provide guidance about table setup
    if (!USE_IN_MEMORY) {
      console.log('NOTE: If you see a "Required tables do not exist" warning, please run:');
      console.log('npm run setup-db');
    }
  } catch (error) {
    console.error('Failed to initialize Corbot:', error);
    process.exit(1);
  }
}

// Status endpoint
app.get('/', (req, res) => {
  if (req.headers.accept?.includes('application/json')) {
    // Return JSON for API clients
    res.json({ 
      status: 'online',
      message: 'Corbot is running',
      agent: corbotAgent ? corbotAgent.getChatStatus() : null
    });
  } else {
    // Serve the HTML page for browser clients
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Corbot running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is already in use. Trying another port...`);
    // Try another port (PORT + 1)
    const newPort = PORT + 1;
    app.listen(newPort, () => {
      console.log(`Corbot running on port ${newPort}`);
    });
  } else {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}); 