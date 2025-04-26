/**
 * Chat Module
 * Handles chat interactions with the agent
 */

const Chat = (() => {
  // Chat state
  let chatHistory = [];
  let isProcessing = false;
  let isInitialized = false;
  
  // DOM elements
  const messagesContainer = document.getElementById('messages');
  const messageForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const clearHistoryButton = document.getElementById('clear-history');
  
  // Agent info elements
  const agentNameElement = document.getElementById('agent-name');
  const agentStatusElement = document.getElementById('agent-status');
  const agentModelElement = document.getElementById('agent-model');
  
  /**
   * Initialize chat module
   */
  const init = () => {
    if (isInitialized) return;
    
    bindEvents();
    updateAgentInfo();
    isInitialized = true;
    console.log('Chat module initialized');
  };
  
  /**
   * Bind event listeners
   */
  const bindEvents = () => {
    if (!messageForm) {
      console.error('Chat form not found');
      return;
    }
    
    // Remove any existing listeners
    messageForm.removeEventListener('submit', handleMessageSend);
    clearHistoryButton?.removeEventListener('click', handleClearHistory);
    
    // Add listeners
    messageForm.addEventListener('submit', handleMessageSend);
    clearHistoryButton?.addEventListener('click', handleClearHistory);
    
    // Add input event listener for Enter key
    messageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleMessageSend(e);
      }
    });

    // Add click listener for send button
    sendButton?.addEventListener('click', (e) => {
      e.preventDefault();
      handleMessageSend(e);
    });
  };
  
  /**
   * Handle message form submission
   */
  const handleMessageSend = async (e) => {
    e.preventDefault();
    
    if (!messageInput) {
      console.error('Message input not found');
      return;
    }
    
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
      displaySystemMessage('Please log in to chat with Corbot.');
      return;
    }
    
    // Display user message immediately
    displayMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    
    // Process message
    await sendMessageToAgent(message);
  };
  
  /**
   * Send message to agent
   */
  const sendMessageToAgent = async (message) => {
    isProcessing = true;
    updateSendButtonState();
    
    try {
      // Show typing indicator
      const typingIndicator = displayTypingIndicator();
      
      // Send API request
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...window.Auth.getAuthHeader()
        },
        body: JSON.stringify({ message })
      });
      
      // Remove typing indicator
      typingIndicator.remove();
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const data = await response.json();
      
      // Display agent response
      displayMessage(data.response, 'assistant');
      
      // Update agent info if changed
      updateAgentInfo(data.agentName, data.agentStatus, data.model);
      
    } catch (error) {
      console.error('Error sending message:', error);
      displaySystemMessage('Error: ' + error.message);
    } finally {
      isProcessing = false;
      updateSendButtonState();
    }
  };
  
  /**
   * Load chat history from server
   */
  const loadChatHistory = async () => {
    if (!window.Auth.isAuthenticated()) return;
    
    try {
      const response = await fetch('/api/chat/history', {
        headers: window.Auth.getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }
      
      const data = await response.json();
      chatHistory = data.history || [];
      
      // Clear current messages
      messagesContainer.innerHTML = '';
      
      // Display welcome message if no history
      if (chatHistory.length === 0) {
        displaySystemMessage('Welcome to Corbot! How can I assist you today?');
        return;
      }
      
      // Display history
      chatHistory.forEach(msg => {
        displayMessage(msg.content, msg.role, false);
      });
      
      // Scroll to bottom
      scrollToBottom();
      
    } catch (error) {
      console.error('Error loading chat history:', error);
      displaySystemMessage('Error loading chat history. ' + error.message);
    }
  };
  
  /**
   * Handle clear history button click
   */
  const handleClearHistory = async () => {
    if (!window.Auth.isAuthenticated()) return;
    
    if (!confirm('Are you sure you want to clear your chat history?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: window.Auth.getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }
      
      // Clear UI
      messagesContainer.innerHTML = '';
      displaySystemMessage('Chat history has been cleared.');
      
    } catch (error) {
      console.error('Error clearing history:', error);
      displaySystemMessage('Error: ' + error.message);
    }
  };
  
  /**
   * Display a message in the chat
   */
  const displayMessage = (content, role = 'system', shouldScroll = true) => {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = content;
    
    messageElement.appendChild(contentElement);
    messagesContainer.appendChild(messageElement);
    
    if (shouldScroll) {
      scrollToBottom();
    }
    
    return messageElement;
  };
  
  /**
   * Display a system message
   */
  const displaySystemMessage = (message) => {
    return displayMessage(message, 'system');
  };
  
  /**
   * Display typing indicator
   */
  const displayTypingIndicator = () => {
    const element = document.createElement('div');
    element.className = 'message assistant typing';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    
    element.appendChild(content);
    messagesContainer.appendChild(element);
    
    scrollToBottom();
    
    return element;
  };
  
  /**
   * Scroll messages to bottom
   */
  const scrollToBottom = () => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };
  
  /**
   * Update send button state
   */
  const updateSendButtonState = () => {
    sendButton.disabled = isProcessing;
  };
  
  /**
   * Update agent info in sidebar
   */
  const updateAgentInfo = (name, status, model) => {
    if (name) {
      agentNameElement.textContent = name;
    }
    
    if (status) {
      agentStatusElement.textContent = status;
    }
    
    if (model) {
      agentModelElement.textContent = model;
    }
  };
  
  // Public API
  return {
    init,
    loadChatHistory,
    displaySystemMessage
  };
})();

// Expose Chat module globally
window.Chat = Chat;

// Initialize chat when DOM is loaded and Auth is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Auth to be available
  if (window.Auth) {
    Chat.init();
  } else {
    console.error('Auth module not found. Chat initialization failed.');
  }
}); 