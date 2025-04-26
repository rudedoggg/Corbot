/**
 * Supabase Authentication Tests
 * Note: These are integration tests that require actual Supabase credentials
 */
const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables for testing
require('dotenv').config();

let app;
let supabase;
let testUserEmail;

// Setup before tests
beforeAll(async () => {
  // Generate a unique test email
  testUserEmail = `test-${Date.now()}@example.com`;
  
  // Create Supabase client
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Import app after setting up the environment
  app = require('../../src/index');
});

// Cleanup after tests
afterAll(async () => {
  // Clean up test user if created
  try {
    if (testUserEmail) {
      // Note: This requires admin access to truly delete users
      // For testing purposes, we can leave them and just use unique emails
      console.log(`Note: Test user ${testUserEmail} should be cleaned up manually`);
    }
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
});

describe('Supabase Authentication', () => {
  // Test user registration
  describe('User Registration', () => {
    test('should register a new user', async () => {
      const userData = {
        username: 'supatestusr',
        email: testUserEmail,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });
    
    test('should fail registration with missing fields', async () => {
      const userData = {
        email: 'incomplete@example.com',
        password: 'password123'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  // Test user login
  describe('User Login', () => {
    test('should login a user with correct credentials', async () => {
      const loginData = {
        email: testUserEmail,
        password: 'Password123!'
      };
      
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe(loginData.email);
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
      
      // Save token for later tests
      process.env.TEST_ACCESS_TOKEN = res.body.tokens.accessToken;
    });
    
    test('should fail login with wrong password', async () => {
      const loginData = {
        email: testUserEmail,
        password: 'wrongpassword'
      };
      
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
    
    test('should fail login with non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  // Test protected route access
  describe('Protected Routes', () => {
    test('should access protected route with valid token', async () => {
      if (!process.env.TEST_ACCESS_TOKEN) {
        console.warn('No test token available, skipping test');
        return;
      }
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${process.env.TEST_ACCESS_TOKEN}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('email');
      expect(res.body.user.email).toBe(testUserEmail);
    });
    
    test('should fail accessing protected route without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
    
    test('should fail accessing protected route with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
}); 