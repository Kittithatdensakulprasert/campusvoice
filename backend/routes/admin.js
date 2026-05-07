const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];
const ALLOWED_ROLES = ['user', 'staff', 'admin'];

// GET /api/admin/users — list all users (admin only)
router.get('/users', verifyToken, roleGuard(['admin']), async (req, res) => {
  try {
    const users = await User.find({})
      .select('email name role created_at')
      .sort({ created_at: -1 })
      .lean();

    res.json({ users: users.map(u => ({ ...u, id: u._id })) });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// PATCH /api/admin/users/:id/role — update user role (admin only)
router.patch('/users/:id/role', verifyToken, roleGuard(['admin']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (id === req.user.id) {
    return res.status(400).json({ error: 'ไม่สามารถเปลี่ยน role ของตัวเองได้' });
  }

  try {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Role updated', userId: id, role });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
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