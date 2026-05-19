const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const { AdminServiceError, createAdminService } = require('../services/adminService');

const adminService = createAdminService();

function handleAdminError(error, res, logLabel) {
  if (error instanceof AdminServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(`${logLabel} error:`, error);
  return res.status(500).json({ error: logLabel });
}

// GET /api/admin/users - list all users (admin only)
router.get('/users', verifyToken, roleGuard(['admin']), async (req, res) => {
  try {
    res.json(await adminService.listUsers());
  } catch (error) {
    handleAdminError(error, res, 'Failed to load users');
  }
});

// PATCH /api/admin/users/:id/role - update user role (admin only)
router.patch('/users/:id/role', verifyToken, roleGuard(['admin']), async (req, res) => {
  try {
    res.json(await adminService.updateUserRole({
      id: req.params.id,
      role: req.body.role,
      currentUserId: req.user.id
    }));
  } catch (error) {
    handleAdminError(error, res, 'Failed to update user role');
  }
});

// GET /api/admin/stats
router.get('/stats', verifyToken, roleGuard(['admin', 'staff']), async (req, res) => {
  try {
    res.json(await adminService.getStats());
  } catch (error) {
    handleAdminError(error, res, 'Failed to load dashboard stats');
  }
});

module.exports = router;
