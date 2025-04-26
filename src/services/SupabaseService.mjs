/**
 * Supabase Service
 * Provides integration with Supabase for authentication and other features
 */
import { createClient } from '@supabase/supabase-js';

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('Supabase credentials missing. Authentication will not work.');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * Register a new user
   */
  async registerUser(userData) {
    try {
      // First, sign up the user
      const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        }
      });
      
      if (signUpError) throw signUpError;

      // If email confirmation is required
      if (!signUpData.session) {
        return {
          user: {
            id: signUpData.user.id,
            email: signUpData.user.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName
          },
          requiresEmailConfirmation: true,
          message: 'Please check your email to confirm your account'
        };
      }

      // If email confirmation is not required or already confirmed
      return {
        user: {
          id: signUpData.user.id,
          email: signUpData.user.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName
        },
        tokens: {
          accessToken: signUpData.session?.access_token,
          refreshToken: signUpData.session?.refresh_token
        }
      };
    } catch (error) {
      console.error('Supabase registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Login a user
   */
  async loginUser(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || data.user.email,
          firstName: data.user.user_metadata?.firstName,
          lastName: data.user.user_metadata?.lastName
        },
        tokens: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }
      };
    } catch (error) {
      console.error('Supabase login error:', error);
      throw new Error(error.message || 'Invalid credentials');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });
      
      if (error) throw error;
      
      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      };
    } catch (error) {
      console.error('Supabase token refresh error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logoutUser(accessToken) {
    try {
      // Set the access token in the client
      this.supabase.auth.setSession(accessToken);
      
      const { error } = await this.supabase.auth.signOut();
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Supabase logout error:', error);
      throw error;
    }
  }

  /**
   * Get user data
   */
  async getCurrentUser(accessToken) {
    try {
      // Set the session in the Supabase client
      this.supabase.auth.setSession(accessToken);
      
      const { data, error } = await this.supabase.auth.getUser();
      
      if (error) throw error;
      
      return {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || data.user.email,
        firstName: data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.lastName
      };
    } catch (error) {
      console.error('Supabase get user error:', error);
      throw error;
    }
  }
}

export default SupabaseService; 