/**
 * LLM Service
 * Provides an abstraction layer for different LLM providers
 */
import OpenAI from 'openai';
import { AppError } from '../../utils/errors.js';

// Provider interface definition for documentation
/**
 * @typedef {Object} LLMProvider
 * @property {function(string[], Object): Promise<string>} generateResponse - Generate a response from messages
 * @property {function(): Promise<string[]>} listModels - List available models
 * @property {function(string): Promise<void>} switchModel - Switch to a different model
 */

class LLMService {
  constructor(config = {}) {
    this.config = config;
    this.currentProvider = config.defaultProvider || 'openai';
    this.currentModel = config.defaultModel || 'gpt-3.5-turbo';
    
    // Initialize providers map
    this.providers = new Map();
    
    // Set up OpenAI if API key is available
    const openaiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.providers.set('openai', {
        client: new OpenAI({ apiKey: openaiKey }),
        generateResponse: this.generateOpenAIResponse.bind(this),
        listModels: this.listOpenAIModels.bind(this),
        switchModel: this.switchOpenAIModel.bind(this)
      });
    }
  }

  /**
   * Switch to a different LLM model
   */
  async switchModel(model, provider = null) {
    if (provider && !this.providers.has(provider)) {
      throw new AppError(`Provider ${provider} not available`, 'INVALID_PROVIDER', 400);
    }
    
    const targetProvider = provider || this.currentProvider;
    const providerInstance = this.providers.get(targetProvider);
    
    if (!providerInstance) {
      throw new AppError('No LLM provider available', 'NO_PROVIDER', 500);
    }
    
    await providerInstance.switchModel(model);
    this.currentProvider = targetProvider;
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
      model: this.currentModel,
      isAvailable: this.providers.has(this.currentProvider)
    };
  }

  /**
   * Process a message with conversation history
   */
  async processMessage(message, history = [], options = {}) {
    const provider = this.providers.get(this.currentProvider);
    
    if (!provider) {
      throw new AppError('No LLM provider available', 'NO_PROVIDER', 500);
    }

    try {
      const messages = this.formatConversationHistory(history);
      
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
      
      return await provider.generateResponse(messages, {
        model: this.currentModel,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000
      });
    } catch (error) {
      throw new AppError(
        `LLM processing failed: ${error.message}`,
        'LLM_PROCESSING_FAILED',
        500
      );
    }
  }

  /**
   * Format conversation history for provider API
   */
  formatConversationHistory(history) {
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Get available models from current provider
   */
  async getAvailableModels() {
    const provider = this.providers.get(this.currentProvider);
    
    if (!provider) {
      throw new AppError('No LLM provider available', 'NO_PROVIDER', 500);
    }

    try {
      return await provider.listModels();
    } catch (error) {
      throw new AppError(
        `Failed to fetch models: ${error.message}`,
        'MODEL_FETCH_FAILED',
        500
      );
    }
  }

  // OpenAI-specific implementations
  async generateOpenAIResponse(messages, options) {
    const provider = this.providers.get('openai');
    
    try {
      const response = await provider.client.chat.completions.create({
        model: options.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        n: 1
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      throw new AppError(`OpenAI API error: ${error.message}`, 'OPENAI_API_ERROR', 500);
    }
  }

  async listOpenAIModels() {
    const provider = this.providers.get('openai');
    
    try {
      const response = await provider.client.models.list();
      return response.data.map(model => model.id);
    } catch (error) {
      console.warn('Failed to fetch OpenAI models:', error);
      // Return common models as fallback
      return ['gpt-3.5-turbo', 'gpt-4'];
    }
  }

  async switchOpenAIModel(model) {
    // Verify the model exists (could add model validation here)
    return Promise.resolve();
  }

  /**
   * Add a new LLM provider
   */
  addProvider(name, provider) {
    if (!provider.generateResponse || !provider.listModels || !provider.switchModel) {
      throw new AppError(
        'Invalid provider implementation',
        'INVALID_PROVIDER_IMPLEMENTATION',
        400
      );
    }
    
    this.providers.set(name, provider);
  }
}

export default LLMService; 