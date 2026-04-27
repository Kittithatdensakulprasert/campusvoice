const express = require('express');
const router = express.Router();
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const pool = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  // TODO: Feature 1 — validate input, hash password, insert user
  res.status(501).json({ message: 'Register endpoint — not yet implemented' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  // TODO: Feature 1 — find user, compare password, return JWT
  res.status(501).json({ message: 'Login endpoint — not yet implemented' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  // TODO: Feature 1 — requires verifyToken middleware, return current user
  res.status(501).json({ message: 'Me endpoint — not yet implemented' });
});

module.exports = router;
