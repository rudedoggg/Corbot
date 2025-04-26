/**
 * Main Application
 * Coordinates between auth and chat modules
 */

const App = (() => {
  /**
   * Initialize app
   */
  const init = () => {
    // Add typing indicator CSS
    setupTypingIndicatorStyle();
    
    // Check and update the current agent model
    checkAgentModel();
  };
  
  /**
   * Set up typing indicator style
   */
  const setupTypingIndicatorStyle = () => {
    const style = document.createElement('style');
    style.textContent = `
      .message.typing .dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #333;
        margin: 0 2px;
        animation: typing 1.4s infinite ease-in-out both;
      }
      
      .message.typing .dot:nth-child(1) {
        animation-delay: 0s;
      }
      
      .message.typing .dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .message.typing .dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typing {
        0%, 80%, 100% { transform: scale(0); opacity: 0; }
        40% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  };
  
  /**
   * Check and update agent model info
   */
  const checkAgentModel = async () => {
    try {
      const response = await fetch('/', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.agent) {
          const modelElement = document.getElementById('agent-model');
          const statusElement = document.getElementById('agent-status');
          
          if (modelElement) {
            modelElement.textContent = data.agent.model || 'Default';
          }
          
          if (statusElement && data.agent.status) {
            statusElement.textContent = data.agent.status;
          }
        }
      }
    } catch (error) {
      console.error('Error checking agent info:', error);
    }
  };
  
  // Public API
  return {
    init
  };
})();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init); 