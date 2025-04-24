/**
 * Base Skill class
 * All skills should extend this class
 */
class Skill {
  constructor(config = {}) {
    this.id = config.id || Math.random().toString(36).substring(2, 9);
    this.name = config.name || 'Unnamed Skill';
    this.description = config.description || '';
    this.version = config.version || '0.1.0';
    this.agent = null; // Will be set when the skill is added to an agent
    this.isEnabled = true;
    this.config = config;
  }

  /**
   * Initialize the skill
   */
  async init(agent) {
    this.agent = agent;
    return true;
  }

  /**
   * Check if this skill can handle a given message
   */
  async canHandle(message) {
    return false;
  }

  /**
   * Process a message if this skill can handle it
   */
  async process(message, userId) {
    throw new Error('Skill.process() must be implemented by subclasses');
  }

  /**
   * Deactivate this skill
   */
  disable() {
    this.isEnabled = false;
    return true;
  }

  /**
   * Activate this skill
   */
  enable() {
    this.isEnabled = true;
    return true;
  }

  /**
   * Get skill status and metadata
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      isEnabled: this.isEnabled
    };
  }
}

module.exports = Skill; 