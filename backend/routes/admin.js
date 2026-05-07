const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');

const ADMIN_USER_FIELDS = `
  id,
  email,
  name,
  role,
  avatar_url,
  created_at,
  updated_at
`;
const VALID_ROLES = ['user', 'staff', 'admin'];

// GET /api/admin/users - list all users (admin only)
router.get('/users', verifyToken, roleGuard(['admin']), async (req, res) => {
  try {
    const [users] = await pool.query(
      `
        SELECT ${ADMIN_USER_FIELDS}
        FROM users
        ORDER BY created_at DESC
      `
    );

    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// PATCH /api/admin/users/:id/role - update user role (admin only)
router.patch('/users/:id/role', verifyToken, roleGuard(['admin']), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role must be one of: user, staff, admin' });
    }

    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [[user]] = await pool.query(
      `
        SELECT ${ADMIN_USER_FIELDS}
        FROM users
        WHERE id = ?
      `,
      [userId]
    );

    res.json({ user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/stats - aggregate stats for dashboard (admin/staff)
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
