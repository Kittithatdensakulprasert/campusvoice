const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];
const ALLOWED_ROLES = ['user', 'staff', 'admin'];
const ADMIN_USER_FIELDS = 'email name role avatar_url created_at updated_at';

function serializeUser(user) {
  if (!user) return null;
  const id = user._id?.toString?.() || user.id;
  return { ...user, id };
}

// GET /api/admin/users - list all users (admin only)
router.get('/users', verifyToken, roleGuard(['admin']), async (req, res) => {
  try {
    const users = await User.find({})
      .select(ADMIN_USER_FIELDS)
      .sort({ created_at: -1 })
      .lean();

    res.json({ users: users.map(serializeUser) });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// PATCH /api/admin/users/:id/role - update user role (admin only)
router.patch('/users/:id/role', verifyToken, roleGuard(['admin']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be one of: user, staff, admin' });
  }

  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  try {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true })
      .select(ADMIN_USER_FIELDS)
      .lean();

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Role updated', userId: id, role, user: serializeUser(user) });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/stats
router.get('/stats', verifyToken, roleGuard(['admin', 'staff']), async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();

    const byCategory = await Issue.aggregate([
      {
        $group: {
          _id: {
            $cond: [{ $or: [{ $eq: ['$category', null] }, { $eq: ['$category', ''] }] }, 'Uncategorized', '$category']
          },
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
