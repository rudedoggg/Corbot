/**
 * Base Agent class that handles core functionality
 */
import { AppError } from '../utils/errors.js';

export class BaseAgent {
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
    this.memory = config.memory;
    this.llm = config.llm;
    this.skills = new Set(config.skills || []);
    
    // Goals and purpose
    this.longTermPurpose = config.longTermPurpose || '';
    this.shortTermGoals = new Set(config.shortTermGoals || []);
    
    // Control flags
    this.isKillSwitchEnabled = config.isKillSwitchEnabled !== false;
    this.isActive = true;
  }

  /**
   * Initialize the agent and its components
   */
  async init() {
    if (!this.isActive) {
      throw new AppError('Agent is deactivated', 'AGENT_INACTIVE', 400);
    }

    this.status = 'initializing';
    
    try {
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
    } catch (error) {
      this.status = 'error';
      throw new AppError(`Failed to initialize agent: ${error.message}`, 'INIT_FAILED', 500);
    }
  }

  /**
   * Add a new skill to the agent
   */
  async addSkill(skill) {
    if (!this.isActive) {
      throw new AppError('Cannot add skills to inactive agent', 'AGENT_INACTIVE', 400);
    }

    try {
      await skill.init(this);
      this.skills.add(skill);
      return `Added skill: ${skill.name}`;
    } catch (error) {
      throw new AppError(`Failed to add skill: ${error.message}`, 'SKILL_ADD_FAILED', 500);
    }
  }

  /**
   * Create a copy of this agent with a new name and potentially different skills
   */
  async replicate(config = {}) {
    if (!this.isActive) {
      throw new AppError('Cannot replicate inactive agent', 'AGENT_INACTIVE', 400);
    }

    // Create a base configuration from current state
    const baseConfig = {
      name: config.name || `${this.name}-Clone`,
      description: config.description || this.description,
      owner: this.owner,
      llm: this.llm,
      memory: config.shareMemory ? this.memory : null,
      isKillSwitchEnabled: this.isKillSwitchEnabled,
      longTermPurpose: config.longTermPurpose || this.longTermPurpose
    };
    
    // Create new agent
    const newAgent = new this.constructor(baseConfig);
    
    // Add skills if specified
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
      throw new AppError('Kill switch is disabled for this agent', 'KILL_SWITCH_DISABLED', 400);
    }
    
    this.isActive = false;
    this.status = 'deactivated';
    
    // Log deactivation event
    console.log(`Agent ${this.name} (${this.id}) deactivated. Reason: ${reason}`);
    
    return { success: true, message: `Agent ${this.name} has been deactivated` };
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      isActive: this.isActive,
      lastActive: this.lastActive,
      skills: Array.from(this.skills).map(s => s.name)
    };
  }
} 