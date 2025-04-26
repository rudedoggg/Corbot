/**
 * Chat Routes
 * Handles chat interactions with Corbot agents
 */
import express from 'express';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import Agent from '../core/Agent.js';

const router = express.Router();

// Reference to the main agent (will be set from index.js)
let corbotAgent = null;

/**
 * Set the agent reference
 */
const setAgent = (agent) => {
  corbotAgent = agent;
};

/**
 * @route   POST /api/chat/message
 * @desc    Send a message to an agent and get a response
 * @access  Private
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, agentId = 'corbot-main' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (!corbotAgent) {
      return res.status(503).json({ error: 'No agent available' });
    }
    
    // Process message and get response
    const response = await corbotAgent.processMessage(message, req.user.id);
    
    res.json({ 
      message: message,
      response: response,
      timestamp: new Date(),
      agentId: corbotAgent.id,
      agentName: corbotAgent.name,
      agentStatus: corbotAgent.status,
      model: corbotAgent.currentLLM
    });
  } catch (error) {
    console.error('Error in chat message route:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * @route   GET /api/chat/history
 * @desc    Get chat history for the current user
 * @access  Private
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    if (!corbotAgent || !corbotAgent.memory) {
      return res.status(503).json({ error: 'Agent memory not available' });
    }
    
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await corbotAgent.memory.getConversationHistory(req.user.id, limit);
    
    res.json({ history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

/**
 * @route   DELETE /api/chat/history
 * @desc    Clear chat history for the current user
 * @access  Private
 */
router.delete('/history', authenticate, async (req, res) => {
  try {
    if (!corbotAgent || !corbotAgent.memory) {
      return res.status(503).json({ error: 'Agent memory not available' });
    }
    
    const result = await corbotAgent.memory.clearUserHistory(req.user.id);
    
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export { router, setAgent }; 