const Issue = require('../models/Issue');

const createIssueRepository = () => ({
  async findIssues({ filter, sort, offset, limit }) {
    return Issue.find(filter)
      .populate('user_id', 'name')
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .lean();
  },

  async findIssuesByIds({ filter, ids }) {
    return Issue.find({ ...filter, _id: { $in: ids } })
      .populate('user_id', 'name')
      .lean();
  },

  async findIssueById(id) {
    return Issue.findById(id)
      .populate('user_id', 'name')
      .lean();
  },

  async findIssueDocumentById(id) {
    return Issue.findById(id);
  },

  async createIssue(data) {
    return Issue.create(data);
  },

  async updateIssueStatus(id, status) {
    return Issue.findByIdAndUpdate(id, { status }, { new: true });
  },

  async updateIssue(id, updates) {
    return Issue.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    )
      .populate('user_id', 'name')
      .lean();
  }
});

module.exports = { createIssueRepository };
