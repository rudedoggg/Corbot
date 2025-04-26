/**
 * In-Memory Service
 * Provides memory storage in development without persistence
 */
import { BaseMemoryService } from './BaseMemoryService.js';

class InMemoryService extends BaseMemoryService {
  constructor(config = {}) {
    super(config);
    this.messages = new Map();
    this.data = new Map();
    this.connected = true;
  }

  async connect() {
    return true;
  }

  async storeMessage(message) {
    this.validateMessage(message);
    
    const userId = message.userId || 'unknown';
    if (!this.messages.has(userId)) {
      this.messages.set(userId, []);
    }
    
    const messageId = Date.now().toString();
    const storedMessage = {
      id: messageId,
      agentId: this.agentId,
      userId: userId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date(),
      encrypted: false
    };
    
    this.messages.get(userId).push(storedMessage);
    return messageId;
  }

  async getConversationHistory(userId, limit = 20) {
    const userMessages = this.messages.get(userId) || [];
    return userMessages.slice(-limit);
  }

  async clearUserHistory(userId) {
    const count = this.messages.get(userId)?.length || 0;
    this.messages.delete(userId);
    return {
      deleted: count,
      success: true
    };
  }

  async storeData(key, value, options = {}) {
    this.data.set(key, {
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      encrypted: false,
      timestamp: new Date()
    });
    return true;
  }

  async getData(key) {
    const data = this.data.get(key);
    if (!data) return null;
    
    try {
      return JSON.parse(data.value);
    } catch {
      return data.value;
    }
  }
}

export default InMemoryService; 