/**
 * Base Agent class
 * All agent types should extend this class
 */
class Agent {
  constructor(config = {}) {
    // Core identity
    this.id = config.id || Math.random().toString(36).substring(2, 9);
    this.name = config.name || `Corbot-${this.id}`;
    this.description = config.description || '';
    this.owner = config.owner || 'system';
    
    // Status tracking
    this.status = 'idle';
    this.createdAt = new Date();
    this.lastActive = new Date();
    
    // Features
    this.memory = config.memory || null;
    this.skills = config.skills || [];
    this.llm = config.llm || null;
    this.currentLLM = config.defaultLLM || 'gpt-3.5-turbo';
    
    // Goals and purpose
    this.longTermPurpose = config.longTermPurpose || '';
    this.shortTermGoals = config.shortTermGoals || [];
    
    // Control flags
    this.isKillSwitchEnabled = config.isKillSwitchEnabled !== false; // Default to true
    this.isActive = true;
  }

  /**
   * Initialize the agent and its components
   */
  async init() {
    this.status = 'initializing';
    
    // Initialize memory if provided
    if (this.memory) {
      await this.memory.connect();
    }
    
    // Initialize skills
    for (const skill of this.skills) {
      await skill.init(this);
    }
    
    this.status = 'ready';
    return true;
  }

  /**
   * Process a message from a user
   */
  async processMessage(message, userId) {
    this.status = 'busy';
    this.lastActive = new Date();
    
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
      const newModel = message.substring(7).trim();
      return this.switchLLM(newModel);
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
    
    this.status = 'idle';
    return response;
  }
  
  /**
   * Generate a response using the current LLM
   */
  async generateResponse(message, userId) {
    // If we have an LLM service, use it
    if (this.llm) {
      try {
        // Get conversation history for context if memory is available
        let history = [];
        if (this.memory) {
          history = await this.memory.getConversationHistory(userId, 10);
        }
        
        // Create system message with agent info
        const systemMessage = `You are ${this.name}, ${this.description}. Your purpose is: ${this.longTermPurpose}`;
        
        // Process with LLM
        return await this.llm.processMessage(message, history, {
          systemMessage,
          model: this.currentLLM
        });
      } catch (error) {
        console.error('Error generating response with LLM:', error);
        return `I'm having trouble connecting to my language model right now. Please try again later.`;
      }
    }
    
    // Fallback to placeholder response
    return `[Response using ${this.currentLLM}]: This is a placeholder. Real LLM responses will be enabled when an OpenAI API key is provided.`;
  }

  /**
   * Switch to a different LLM model
   */
  async switchLLM(model) {
    this.currentLLM = model;
    
    // Update the LLM service if available
    if (this.llm) {
      this.llm.switchModel(model);
    }
    
    return `Switched to model: ${model}`;
  }
  
  /**
   * Add a new skill to the agent
   */
  async addSkill(skill) {
    await skill.init(this);
    this.skills.push(skill);
    return `Added skill: ${skill.name}`;
  }
  
  /**
   * Create a copy of this agent with a new name and potentially different skills
   */
  async replicate(config = {}) {
    // Create a base configuration from current state
    const baseConfig = {
      name: config.name || `${this.name}-Clone`,
      description: config.description || this.description,
      owner: this.owner,
      llm: this.llm,
      defaultLLM: this.currentLLM,
      memory: config.shareMemory ? this.memory : null,
      isKillSwitchEnabled: this.isKillSwitchEnabled,
      longTermPurpose: config.longTermPurpose || this.longTermPurpose
    };
    
    // Create new agent
    const newAgent = new Agent(baseConfig);
    
    // Add skills - either from config or copy existing
    if (config.skills) {
      for (const skill of config.skills) {
        await newAgent.addSkill(skill);
      }
    } else if (config.copySkills) {
      for (const skill of this.skills) {
        await newAgent.addSkill(skill);
      }
    }
    
    return newAgent;
  }

  /**
   * Deactivate the agent (kill switch)
   */
  async deactivate(reason = 'Unknown') {
    if (!this.isKillSwitchEnabled) {
      return { success: false, message: 'Kill switch is disabled for this agent' };
    }
    
    this.isActive = false;
    this.status = 'deactivated';
    
    // Log deactivation event
    console.log(`Agent ${this.name} (${this.id}) deactivated. Reason: ${reason}`);
    
    return { success: true, message: `Agent ${this.name} has been deactivated` };
  }
}

export default Agent; 