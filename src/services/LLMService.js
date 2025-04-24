/**
 * LLM Service
 * Provides an abstraction layer for different LLM providers
 */
const OpenAI = require('openai');

class LLMService {
  constructor(config = {}) {
    this.config = config;
    this.currentProvider = config.defaultProvider || 'openai';
    this.currentModel = config.defaultModel || 'gpt-3.5-turbo';
    
    // Initialize providers
    this.providers = {
      openai: new OpenAI({
        apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY
      })
    };
    
    // Add other providers here as needed
  }

  /**
   * Switch to a different LLM model
   */
  switchModel(model, provider = null) {
    // If provider is specified, switch provider too
    if (provider && this.providers[provider]) {
      this.currentProvider = provider;
    }
    
    this.currentModel = model;
    return { 
      success: true, 
      message: `Switched to ${this.currentModel} on ${this.currentProvider}`
    };
  }

  /**
   * Get information about current model
   */
  getCurrentModel() {
    return {
      provider: this.currentProvider,
      model: this.currentModel
    };
  }

  /**
   * Process a message with conversation history
   */
  async processMessage(message, history = [], options = {}) {
    switch (this.currentProvider) {
      case 'openai':
        return this.processWithOpenAI(message, history, options);
      // Add cases for other providers
      default:
        throw new Error(`Unsupported LLM provider: ${this.currentProvider}`);
    }
  }

  /**
   * Process a message using OpenAI
   */
  async processWithOpenAI(message, history = [], options = {}) {
    try {
      // Format history for OpenAI API
      const messages = this.formatHistoryForOpenAI(history);
      
      // Add the current message
      messages.push({
        role: 'user',
        content: message
      });
      
      // Add system message if provided
      if (options.systemMessage) {
        messages.unshift({
          role: 'system',
          content: options.systemMessage
        });
      }
      
      // Call OpenAI API
      const response = await this.providers.openai.chat.completions.create({
        model: this.currentModel,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        n: 1
      });
      
      // Extract and return response text
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  /**
   * Format conversation history for OpenAI API
   */
  formatHistoryForOpenAI(history) {
    // Convert history to the format required by OpenAI
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Get a list of available models from the current provider
   */
  async getAvailableModels() {
    switch (this.currentProvider) {
      case 'openai':
        try {
          const response = await this.providers.openai.models.list();
          return response.data.map(model => model.id);
        } catch (error) {
          console.error('Error fetching OpenAI models:', error);
          return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o']; // Fallback
        }
      // Add cases for other providers
      default:
        return [];
    }
  }
}

module.exports = LLMService; 