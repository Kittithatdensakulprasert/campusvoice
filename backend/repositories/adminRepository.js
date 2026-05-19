const Issue = require('../models/Issue');
const User = require('../models/User');

const ADMIN_USER_FIELDS = 'email name role avatar_url created_at updated_at';

const createAdminRepository = () => ({
  async findUsers() {
    return User.find({})
      .select(ADMIN_USER_FIELDS)
      .sort({ created_at: -1 })
      .lean();
  },

  async updateUserRole(id, role) {
    return User.findByIdAndUpdate(id, { role }, { new: true })
      .select(ADMIN_USER_FIELDS)
      .lean();
  },

  async deleteUser(id) {
    return User.findByIdAndDelete(id)
      .select(ADMIN_USER_FIELDS)
      .lean();
  },

  async countIssues() {
    return Issue.countDocuments();
  },

  async countIssuesByCategory() {
    return Issue.aggregate([
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
  },

  async countIssuesByStatus() {
    return Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);
  }
});

module.exports = { createAdminRepository };
