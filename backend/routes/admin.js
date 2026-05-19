const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const { AdminServiceError, createAdminService } = require('../services/adminService');

function handleAdminError(error, res, logLabel) {
  if (error instanceof AdminServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(`${logLabel} error:`, error);
  return res.status(500).json({ error: logLabel });
}

const buildAdminRouter = ({
  adminService = createAdminService(),
  authMiddleware = verifyToken,
  adminGuard = roleGuard(['admin']),
  staffGuard = roleGuard(['admin', 'staff'])
} = {}) => {
  const router = express.Router();

  // GET /api/admin/users - list all users (admin only)
  router.get('/users', authMiddleware, adminGuard, async (req, res) => {
    try {
      return res.json(await adminService.listUsers());
    } catch (error) {
      return handleAdminError(error, res, 'Failed to load users');
    }
  });

  // PATCH /api/admin/users/:id/role - update user role (admin only)
  router.patch('/users/:id/role', authMiddleware, adminGuard, async (req, res) => {
    try {
      return res.json(await adminService.updateUserRole({
        id: req.params.id,
        role: req.body.role,
        currentUserId: req.user.id
      }));
    } catch (error) {
      return handleAdminError(error, res, 'Failed to update user role');
    }
  });

  // GET /api/admin/stats
  router.get('/stats', authMiddleware, staffGuard, async (req, res) => {
    try {
      return res.json(await adminService.getStats());
    } catch (error) {
      return handleAdminError(error, res, 'Failed to load dashboard stats');
    }
  });

  return router;
};

module.exports = buildAdminRouter();
module.exports.buildAdminRouter = buildAdminRouter;
