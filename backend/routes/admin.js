const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

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

// GET /api/admin/stats
router.get('/stats', verifyToken, roleGuard(['admin', 'staff']), async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();

    const byCategory = await Issue.aggregate([
      {
        $group: {
          _id: { $ifNull: [{ $nullIf: ['$category', ''] }, 'Uncategorized'] },
          count: { $sum: 1 },
        },
      },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    const byStatusRaw = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    const byStatus = STATUS_ORDER
      .map(s => byStatusRaw.find(r => r.status === s))
      .filter(Boolean);

    res.json({ totalIssues, byCategory, byStatus });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

module.exports = router;