/**
 * Base Agent class
 * All agent types should extend this class
 */
class Agent {
  constructor(config = {}) {
    this.id = config.id || Math.random().toString(36).substring(2, 9);
    this.name = config.name || `Agent-${this.id}`;
    this.description = config.description || '';
    this.status = 'idle';
    this.createdAt = new Date();
    this.lastActive = new Date();
  }

  /**
   * Initialize the agent
   */
  async init() {
    this.status = 'ready';
    return true;
  }

  /**
   * Execute a task with the agent
   */
  async execute(task) {
    this.status = 'busy';
    this.lastActive = new Date();
    
    // To be implemented by specific agent types
    console.log(`Agent ${this.name} executing task: ${JSON.stringify(task)}`);
    
    this.status = 'idle';
    return { success: true, message: 'Task completed' };
  }

  /**
   * Stop the agent
   */
  async stop() {
    this.status = 'stopped';
    return true;
  }
}

module.exports = Agent; 