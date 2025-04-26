/**
 * Base Authentication Service
 * Defines the interface for authentication services
 */
import { AppError, AuthError } from '../../utils/errors.js';

export class BaseAuthService {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Register a new user
   */
  async registerUser(userData) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Login a user
   */
  async loginUser(email, password) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Logout a user
   */
  async logoutUser(token) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Get current user information
   */
  async getCurrentUser(token) {
    throw new AppError('Method not implemented', 'NOT_IMPLEMENTED', 500);
  }

  /**
   * Validate user data for registration
   */
  validateUserData(userData) {
    const { email, password, username } = userData;

    if (!email) {
      throw new AuthError('Email is required', 'INVALID_EMAIL');
    }
    if (!this.isValidEmail(email)) {
      throw new AuthError('Invalid email format', 'INVALID_EMAIL');
    }
    if (!password) {
      throw new AuthError('Password is required', 'INVALID_PASSWORD');
    }
    if (password.length < 8) {
      throw new AuthError('Password must be at least 8 characters', 'INVALID_PASSWORD');
    }
    if (!username) {
      throw new AuthError('Username is required', 'INVALID_USERNAME');
    }
    if (username.length < 3) {
      throw new AuthError('Username must be at least 3 characters', 'INVALID_USERNAME');
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate token format
   */
  validateToken(token) {
    if (!token) {
      throw new AuthError('Token is required', 'INVALID_TOKEN');
    }
    // Basic JWT format validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new AuthError('Invalid token format', 'INVALID_TOKEN');
    }
  }
} 