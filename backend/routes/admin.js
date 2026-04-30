const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');

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
router.get('/stats', verifyToken, roleGuard(['admin', 'staff']), async (req, res) => {
  try {
    const [[totalRow]] = await pool.query('SELECT COUNT(*) AS totalIssues FROM issues');
    const [byCategory] = await pool.query(
      `
        SELECT COALESCE(NULLIF(category, ''), 'Uncategorized') AS category, COUNT(*) AS count
        FROM issues
        GROUP BY COALESCE(NULLIF(category, ''), 'Uncategorized')
        ORDER BY count DESC
      `
    );
    const [byStatus] = await pool.query(
      `
        SELECT status, COUNT(*) AS count
        FROM issues
        GROUP BY status
        ORDER BY FIELD(status, 'open', 'in_progress', 'resolved', 'closed')
      `
    );

    res.json({
      totalIssues: totalRow.totalIssues,
      byCategory,
      byStatus
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

module.exports = router;
