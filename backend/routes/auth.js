const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { createAuthRepository } = require('../repositories/authRepository');
const { AuthError, createAuthService } = require('../services/authService');

const getRateLimitKey = (req, email) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || req.ip || '')
        .split(',')[0]
        .trim();

  return `${clientIp || 'unknown'}:${String(email || '').trim().toLowerCase()}`;
};

const handleAuthError = (error, res) => {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
};

const buildAuthRouter = ({
  authService = createAuthService({
    authRepository: createAuthRepository()
  }),
  authMiddleware = verifyToken
} = {}) => {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    try {
      const result = await authService.register(req.body || {});
      return res.status(201).json({
        message: 'Registration successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const result = await authService.login(req.body || {}, {
        rateLimitKey: getRateLimitKey(req, req.body?.email)
      });

      return res.status(200).json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  });

  router.post('/login-tu', async (req, res) => {
    try {
      const result = await authService.login({
        ...req.body,
        authType: 'tu'
      }, {
        rateLimitKey: getRateLimitKey(req, req.body?.email)
      });

      return res.status(200).json({
        message: 'TU Login successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  });

  router.get('/test-tu-api', async (req, res) => {
    try {
      const { createTuApiService } = require('../services/tuApiService');
      const tuApiService = createTuApiService();
      
      // Test with a simple request
      const response = await tuApiService.authenticate('test', 'test');
      
      return res.status(200).json({
        message: 'TU API connection test',
        response: response
      });
    } catch (error) {
      return res.status(500).json({
        message: 'TU API test failed',
        error: error.message
      });
    }
  });

  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const user = await authService.getCurrentUser(req.user?.id);
      return res.status(200).json({ user });
    } catch (error) {
      return handleAuthError(error, res);
    }
  });

  return router;
};

module.exports = buildAuthRouter();
module.exports.buildAuthRouter = buildAuthRouter;
