const mongoose = require('mongoose');
const { createAdminRepository } = require('../repositories/adminRepository');

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];
const ALLOWED_ROLES = ['user', 'staff', 'admin'];

class AdminServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AdminServiceError';
    this.statusCode = statusCode;
  }
}

function serializeUser(user) {
  if (!user) return null;
  const id = user._id?.toString?.() || user.id;
  return { ...user, id };
}

const createAdminService = ({
  adminRepository = createAdminRepository()
} = {}) => ({
  async listUsers() {
    const users = await adminRepository.findUsers();
    return { users: users.map(serializeUser) };
  },

  async updateUserRole({ id, role, currentUserId }) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AdminServiceError('Invalid user id', 400);
    }

    if (!ALLOWED_ROLES.includes(role)) {
      throw new AdminServiceError('Role must be one of: user, staff, admin', 400);
    }

    if (id === currentUserId) {
      throw new AdminServiceError('Cannot change your own role', 400);
    }

    const user = await adminRepository.updateUserRole(id, role);
    if (!user) {
      throw new AdminServiceError('User not found', 404);
    }

    return { message: 'Role updated', userId: id, role, user: serializeUser(user) };
  },

  async getStats() {
    const [totalIssues, byCategory, byStatusRaw] = await Promise.all([
      adminRepository.countIssues(),
      adminRepository.countIssuesByCategory(),
      adminRepository.countIssuesByStatus()
    ]);

    const byStatus = STATUS_ORDER
      .map(status => byStatusRaw.find(row => row.status === status))
      .filter(Boolean);

    return { totalIssues, byCategory, byStatus };
  }
});

module.exports = { AdminServiceError, createAdminService };
