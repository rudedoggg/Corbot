/**
 * Authentication Middleware
 * Validates JWT tokens using Supabase or provides mock auth for development
 */
import { AuthError } from '../utils/errors.js';

const USE_IN_MEMORY = process.env.USE_IN_MEMORY_DB === 'true';
let authService = null;

async function initializeAuthService() {
  if (!authService) {
    if (USE_IN_MEMORY) {
      const { default: DevAuthService } = await import('../services/auth/DevAuthService.js');
      authService = new DevAuthService();
    } else {
      const { SupabaseAuthService } = await import('../services/auth/SupabaseAuthService.js');
      authService = new SupabaseAuthService();
    }
  }
  return authService;
}

/**
 * Extract token from request headers
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED');
  }
  
  return authHeader.split(' ')[1];
};

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const service = await initializeAuthService();
    const token = extractToken(req);
    const user = await service.getCurrentUser(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check admin role
 * Note: Requires setup of admin roles in Supabase
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const service = await initializeAuthService();
    if (!req.user || req.user.appRole !== 'admin') {
      next(new AuthError('Admin access required', 'ADMIN_REQUIRED', 403));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block request if not
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const service = await initializeAuthService();
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const user = await service.getCurrentUser(token);
    req.user = user;
    next();
  } catch (error) {
    // Just log the error but don't block the request
    console.warn('Optional auth failed:', error);
    next();
  }
}; 