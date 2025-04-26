/**
 * Auth Module
 * Handles authentication logic (login, register, logout)
 */

const Auth = (() => {
  // State
  let currentUser = null;
  let tokens = {
    accessToken: null,
    refreshToken: null
  };

  // Cache DOM elements
  const userInfoElement = document.getElementById('user-info');
  const authControlsElement = document.getElementById('auth-controls');
  const usernameElement = document.getElementById('username');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const welcomeLoginBtn = document.getElementById('welcome-login-btn');
  const welcomeRegisterBtn = document.getElementById('welcome-register-btn');
  
  // Auth container and forms
  const authContainer = document.getElementById('auth-container');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginErrorElement = document.getElementById('login-error');
  const registerErrorElement = document.getElementById('register-error');
  const switchToRegisterBtn = document.getElementById('switch-to-register');
  const switchToLoginBtn = document.getElementById('switch-to-login');

  // Welcome and chat containers
  const welcomeContainer = document.getElementById('welcome-container');
  const chatContainer = document.getElementById('chat-container');

  /**
   * Initialize authentication
   */
  const init = () => {
    // Check for existing tokens in localStorage
    const savedTokens = localStorage.getItem('auth_tokens');
    if (savedTokens) {
      tokens = JSON.parse(savedTokens);
      // Verify token and get user info
      getCurrentUser();
    }
    
    // Set up event listeners
    bindEvents();
  };

  /**
   * Bind event listeners
   */
  const bindEvents = () => {
    // Auth UI control buttons
    loginBtn?.addEventListener('click', showLoginForm);
    registerBtn?.addEventListener('click', showRegisterForm);
    logoutBtn?.addEventListener('click', logout);
    welcomeLoginBtn?.addEventListener('click', showLoginForm);
    welcomeRegisterBtn?.addEventListener('click', showRegisterForm);
    
    // Form switch buttons
    switchToRegisterBtn?.addEventListener('click', showRegisterForm);
    switchToLoginBtn?.addEventListener('click', showLoginForm);
    
    // Form submissions
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);
    
    // Close modal when clicking outside
    authContainer?.addEventListener('click', (e) => {
      if (e.target === authContainer) {
        hideAuthForms();
      }
    });
  };

  /**
   * Show login form
   */
  const showLoginForm = () => {
    authContainer.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginErrorElement.classList.add('hidden');
    document.getElementById('login-email').focus();
  };

  /**
   * Show register form
   */
  const showRegisterForm = () => {
    authContainer.classList.remove('hidden');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerErrorElement.classList.add('hidden');
    document.getElementById('register-username').focus();
  };

  /**
   * Hide all auth forms
   */
  const hideAuthForms = () => {
    authContainer.classList.add('hidden');
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
  };

  /**
   * Handle login form submission
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      loginErrorElement.classList.add('hidden');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store user and tokens
      currentUser = data.user;
      tokens = data.tokens;
      
      // Save tokens to localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      
      // Update UI
      updateAuthUI();
      hideAuthForms();
      
      // Show chat UI
      showChatInterface();
      
    } catch (error) {
      console.error('Login error:', error);
      loginErrorElement.textContent = error.message;
      loginErrorElement.classList.remove('hidden');
    }
  };

  /**
   * Handle register form submission
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const firstName = document.getElementById('register-firstName').value;
    const lastName = document.getElementById('register-lastName').value;
    
    try {
      registerErrorElement.classList.add('hidden');
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          firstName,
          lastName
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Check if email confirmation is required
      if (data.requiresEmailConfirmation) {
        // Show success message
        registerErrorElement.textContent = data.message;
        registerErrorElement.style.color = 'var(--success-color)';
        registerErrorElement.classList.remove('hidden');
        
        // Clear the form
        registerForm.reset();
        
        // Switch to login form after 3 seconds
        setTimeout(() => {
          showLoginForm();
        }, 3000);
        
        return;
      }
      
      // If no email confirmation required, proceed with login
      currentUser = data.user;
      tokens = data.tokens;
      
      // Save tokens to localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      
      // Update UI
      updateAuthUI();
      hideAuthForms();
      
      // Show chat UI
      showChatInterface();
      
    } catch (error) {
      console.error('Registration error:', error);
      registerErrorElement.style.color = 'var(--danger-color)';
      registerErrorElement.textContent = error.message;
      registerErrorElement.classList.remove('hidden');
    }
  };

  /**
   * Handle logout
   */
  const logout = async () => {
    try {
      // Call logout API
      if (tokens.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('auth_tokens');
      currentUser = null;
      tokens = { accessToken: null, refreshToken: null };
      
      // Update UI
      updateAuthUI();
      showWelcomeScreen();
    }
  };

  /**
   * Get current user info
   */
  const getCurrentUser = async () => {
    try {
      if (!tokens.accessToken) return null;
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });
      
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry with new token
          return getCurrentUser();
        } else {
          // Failed to refresh, logout
          return logout();
        }
      }
      
      const data = await response.json();
      currentUser = data.user;
      
      // Update UI
      updateAuthUI();
      showChatInterface();
      
      return currentUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  /**
   * Refresh access token
   */
  const refreshToken = async () => {
    try {
      if (!tokens.refreshToken) return false;
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken
        })
      });
      
      if (!response.ok) return false;
      
      const newTokens = await response.json();
      tokens = newTokens;
      
      // Save to localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  /**
   * Update auth UI based on current state
   */
  const updateAuthUI = () => {
    if (currentUser) {
      // User is logged in
      userInfoElement.classList.remove('hidden');
      authControlsElement.classList.add('hidden');
      usernameElement.textContent = currentUser.username || currentUser.email;
    } else {
      // User is not logged in
      userInfoElement.classList.add('hidden');
      authControlsElement.classList.remove('hidden');
    }
  };

  /**
   * Show welcome screen (not logged in)
   */
  const showWelcomeScreen = () => {
    welcomeContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
  };

  /**
   * Show chat interface (logged in)
   */
  const showChatInterface = () => {
    welcomeContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Initialize chat module if not already initialized
    if (window.Chat && typeof window.Chat.init === 'function') {
      window.Chat.init();
    }
    
    // Load chat history
    if (window.Chat && typeof window.Chat.loadChatHistory === 'function') {
      window.Chat.loadChatHistory();
    }
  };

  /**
   * Get authorization header for API calls
   */
  const getAuthHeader = () => {
    return tokens.accessToken ? { 'Authorization': `Bearer ${tokens.accessToken}` } : {};
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return !!currentUser && !!tokens.accessToken;
  };

  // Public API
  return {
    init,
    isAuthenticated,
    getAuthHeader,
    getCurrentUser,
    logout
  };
})();

// Expose Auth module globally
window.Auth = Auth;

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', Auth.init); 