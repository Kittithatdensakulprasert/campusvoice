const Vote = require('../models/Vote');

const createVoteRepository = () => ({
  async getIssueIdsByVoteCount() {
    return Vote.aggregate([
      { $group: { _id: '$issue_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  },

  async countVotesByIssueIds(issueIds) {
    return Vote.aggregate([
      { $match: { issue_id: { $in: issueIds } } },
      { $group: { _id: '$issue_id', count: { $sum: 1 } } },
    ]);
  },

  async findByUserAndIssue(userId, issueId) {
    return Vote.findOne({ user_id: userId, issue_id: issueId });
  },

  async createVote(userId, issueId) {
    return Vote.create({ user_id: userId, issue_id: issueId });
  },

  async deleteVoteById(id) {
    return Vote.deleteOne({ _id: id });
  },

  async countVotesByIssueId(issueId) {
    return Vote.countDocuments({ issue_id: issueId });
  }
});

module.exports = { createVoteRepository };
