/**
 * ChatAgent class for handling chat interactions
 */
import { BaseAgent } from './BaseAgent.js';
import { AppError } from '../utils/errors.js';

export class ChatAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.currentLLM = config.defaultLLM || 'gpt-3.5-turbo';
  }

  /**
   * Process a message from a user
   */
  async processMessage(message, userId) {
    if (!this.isActive) {
      throw new AppError('Agent is deactivated', 'AGENT_INACTIVE', 400);
    }

    this.status = 'busy';
    this.lastActive = new Date();
    
    try {
      // Store message in memory if available
      if (this.memory) {
        await this.memory.storeMessage({
          role: 'user',
          content: message,
          userId,
          timestamp: new Date()
        });
      }
      
      // Check for system commands
      if (message.toLowerCase().startsWith('/model ')) {
        return this.switchLLM(message.substring(7).trim());
      }
      
      // Process with current LLM
      const response = await this.generateResponse(message, userId);
      
      // Store response in memory if available
      if (this.memory) {
        await this.memory.storeMessage({
          role: 'assistant',
          content: response,
          userId: userId || 'unknown',
          timestamp: new Date()
        });
      }
      
      return response;
    } catch (error) {
      throw new AppError(`Failed to process message: ${error.message}`, 'MESSAGE_PROCESSING_FAILED', 500);
    } finally {
      this.status = 'idle';
    }
  }
  
  /**
   * Generate a response using the current LLM
   */
  async generateResponse(message, userId) {
    if (!this.llm) {
      return `[Response using ${this.currentLLM}]: This is a placeholder. Real LLM responses will be enabled when an OpenAI API key is provided.`;
    }

    try {
      // Get conversation history for context if memory is available
      const history = this.memory ? 
        await this.memory.getConversationHistory(userId, 10) : 
        [];
      
      // Create system message with agent info
      const systemMessage = `You are ${this.name}, ${this.description}. Your purpose is: ${this.longTermPurpose}`;
      
      // Process with LLM
      return await this.llm.processMessage(message, history, {
        systemMessage,
        model: this.currentLLM
      });
    } catch (error) {
      throw new AppError(`Failed to generate response: ${error.message}`, 'RESPONSE_GENERATION_FAILED', 500);
    }
  }

  /**
   * Switch to a different LLM model
   */
  async switchLLM(model) {
    try {
      this.currentLLM = model;
      
      // Update the LLM service if available
      if (this.llm) {
        await this.llm.switchModel(model);
      }
      
      return `Switched to model: ${model}`;
    } catch (error) {
      throw new AppError(`Failed to switch LLM model: ${error.message}`, 'MODEL_SWITCH_FAILED', 500);
    }
  }

  /**
   * Get chat-specific status information
   */
  getChatStatus() {
    return {
      ...this.getStatus(),
      currentLLM: this.currentLLM,
      memoryEnabled: !!this.memory,
      llmEnabled: !!this.llm
    };
  }
} 