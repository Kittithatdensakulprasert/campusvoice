const express = require('express');
const router = express.Router();
// const pool = require('../db');
// const verifyToken = require('../middleware/verifyToken');
// const roleGuard = require('../middleware/roleGuard');

// GET /api/admin/users — list all users (admin only)
router.get('/users', async (req, res) => {
  // TODO: Feature 6 — verifyToken + roleGuard(['admin'])
  res.status(501).json({ message: 'List users — not yet implemented' });
});

// PATCH /api/admin/users/:id/role — update user role (admin only)
router.patch('/users/:id/role', async (req, res) => {
  // TODO: Feature 6 — verifyToken + roleGuard(['admin'])
  res.status(501).json({ message: 'Update user role — not yet implemented' });
});

// GET /api/admin/stats — aggregate stats for dashboard (admin/staff)
router.get('/stats', async (req, res) => {
  // TODO: Feature 5 — verifyToken + roleGuard(['admin', 'staff'])
  // Returns: issues count by category, count by status
  res.status(501).json({ message: 'Stats — not yet implemented' });
});

module.exports = router;
