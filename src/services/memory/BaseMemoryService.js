/**
 * Base Memory Service
 * Defines the interface for memory services
 */
import { AppError } from '../../utils/errors.js';

export class BaseMemoryService {
  constructor(config = {}) {
    this.agentId = config.agentId;
    if (!this.agentId) {
      throw new AppError('Agent ID is required', 'INVALID_CONFIG', 400);
    }
  }

  /**
   * Connect to the memory store
   */
  async connect() {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Store a message in memory
   */
  async storeMessage(message) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(userId, limit = 20) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Clear conversation history for a specific user
   */
  async clearUserHistory(userId) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Store structured data
   */
  async storeData(key, value, options = {}) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Retrieve structured data
   */
  async getData(key) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Validate message format
   */
  validateMessage(message) {
    if (!message.content) {
      throw new AppError('Message content is required', 'INVALID_MESSAGE', 400);
    }
    if (!message.role) {
      throw new AppError('Message role is required', 'INVALID_MESSAGE', 400);
    }
    if (!['user', 'assistant', 'system'].includes(message.role)) {
      throw new AppError('Invalid message role', 'INVALID_MESSAGE', 400);
    }
  }
} 