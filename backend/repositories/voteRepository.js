const Vote = require('../models/Vote');

const createVoteRepository = () => ({
  async findByUserAndIssue(userId, issueId) {
    return Vote.findOne({ user_id: userId, issue_id: issueId });
  },

  async create(userId, issueId) {
    return Vote.create({ user_id: userId, issue_id: issueId });
  },

  async deleteByUserAndIssue(userId, issueId) {
    return Vote.deleteOne({ user_id: userId, issue_id: issueId });
  },

  async countByIssue(issueId) {
    return Vote.countDocuments({ issue_id: issueId });
  },
});

module.exports = { createVoteRepository };