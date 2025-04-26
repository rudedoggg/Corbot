/**
 * Development Authentication Service
 * Provides mock authentication for development
 */
import { AuthError } from '../../utils/errors.js';

class DevAuthService {
  constructor() {
    this.mockUser = {
      id: 'dev-user-1',
      email: 'dev@example.com',
      role: 'user',
      name: 'Development User'
    };
  }

  async getCurrentUser(token) {
    // In development, always return the mock user
    return this.mockUser;
  }

  async login(email, password) {
    return {
      user: this.mockUser,
      token: 'mock-token'
    };
  }

  async logout() {
    return true;
  }
}

export default DevAuthService; 