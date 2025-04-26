/**
 * Authentication Routes
 */
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/errors.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();
const USE_IN_MEMORY = process.env.USE_IN_MEMORY_DB === 'true';

let authService = null;

async function getAuthService() {
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
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(async (req, res) => {
  const service = await getAuthService();
  const { username, email, password, firstName, lastName } = req.body;
  
  // Basic validation
  if (!username || !email || !password) {
    throw new ValidationError('Please provide username, email, and password');
  }
  
  const result = await service.registerUser({
    username,
    email,
    password,
    firstName,
    lastName
  });
  
  res.status(201).json(result);
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  const service = await getAuthService();
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new ValidationError('Please provide email and password');
  }
  
  const result = await service.loginUser(email, password);
  res.json(result);
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const service = await getAuthService();
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }
  
  const tokens = await service.refreshToken(refreshToken);
  res.json(tokens);
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  // User is already attached to req by auth middleware
  res.json({ user: req.user });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const service = await getAuthService();
  const token = req.headers.authorization.split(' ')[1];
  await service.logoutUser(token);
  res.json({ message: 'Logged out successfully' });
}));

export default router; 