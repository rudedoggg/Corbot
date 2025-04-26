/**
 * Supabase Authentication Service
 */
import { createClient } from '@supabase/supabase-js';
import { BaseAuthService } from './BaseAuthService.js';
import { AuthError } from '../../utils/errors.js';

export class SupabaseAuthService extends BaseAuthService {
  constructor(config = {}) {
    super(config);
    
    this.supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
    this.supabaseKey = config.supabaseKey || process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new AuthError(
        'Supabase credentials missing',
        'INVALID_CONFIG'
      );
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * Register a new user
   */
  async registerUser(userData) {
    try {
      // Validate user data
      this.validateUserData(userData);
      
      const { email, password, username, firstName, lastName } = userData;
      
      // Register with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name: firstName,
            last_name: lastName
          }
        }
      });
      
      if (authError) throw authError;
      
      // Return user data and session
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: authData.user.user_metadata.username,
          firstName: authData.user.user_metadata.first_name,
          lastName: authData.user.user_metadata.last_name
        },
        session: authData.session
      };
    } catch (error) {
      if (error.message.includes('already registered')) {
        throw new AuthError('Email already registered', 'EMAIL_EXISTS');
      }
      throw new AuthError(`Registration failed: ${error.message}`, 'REGISTRATION_FAILED');
    }
  }

  /**
   * Login a user
   */
  async loginUser(email, password) {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw authError;
      
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: authData.user.user_metadata.username,
          firstName: authData.user.user_metadata.first_name,
          lastName: authData.user.user_metadata.last_name
        },
        session: authData.session
      };
    } catch (error) {
      throw new AuthError('Invalid login credentials', 'INVALID_CREDENTIALS');
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken) {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });
      
      if (authError) throw authError;
      
      return {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token
      };
    } catch (error) {
      throw new AuthError('Failed to refresh token', 'REFRESH_FAILED');
    }
  }

  /**
   * Logout a user
   */
  async logoutUser(token) {
    try {
      this.validateToken(token);
      
      const { error } = await this.supabase.auth.signOut();
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      throw new AuthError('Logout failed', 'LOGOUT_FAILED');
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(token) {
    try {
      this.validateToken(token);
      
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      
      if (error) throw error;
      if (!user) throw new Error('User not found');
      
      return {
        id: user.id,
        email: user.email,
        username: user.user_metadata.username,
        firstName: user.user_metadata.first_name,
        lastName: user.user_metadata.last_name,
        appRole: user.app_metadata.role || 'user'
      };
    } catch (error) {
      if (error.message.includes('expired')) {
        throw new AuthError('Token expired', 'TOKEN_EXPIRED');
      }
      throw new AuthError('Invalid token', 'INVALID_TOKEN');
    }
  }
} 