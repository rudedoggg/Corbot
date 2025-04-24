/**
 * Default configuration
 */
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  agents: {
    defaultTimeout: 60000, // ms
    maxConcurrent: 10
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/agent-framework.log'
  }
}; 