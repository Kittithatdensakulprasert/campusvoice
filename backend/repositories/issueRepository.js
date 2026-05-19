const Issue = require('../models/Issue');
const Vote = require('../models/Vote');
const { formatIssues } = require('../lib/issueHelpers');

const createIssueRepository = () => ({
  async findAll({ filter = {}, sortOption = { created_at: -1 }, limit = 50, offset = 0 } = {}) {
    const issues = await Issue.find(filter)
      .populate('user_id', 'name')
      .sort(sortOption)
      .skip(offset)
      .limit(limit)
      .lean();
    return formatIssues(issues);
  },

  async findAllSortedByVotes(filter = {}) {
    const ids = await Vote.aggregate([
      { $group: { _id: '$issue_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const sortedIds = ids.map(v => v._id);
    const allIssues = await Issue.find({ ...filter, _id: { $in: sortedIds } })
      .populate('user_id', 'name')
      .lean();
    const idxMap = Object.fromEntries(sortedIds.map((id, i) => [id.toString(), i]));
    const sorted = allIssues.sort(
      (a, b) => (idxMap[a._id.toString()] ?? 999) - (idxMap[b._id.toString()] ?? 999)
    );
    return formatIssues(sorted);
  },

  async findById(id) {
    const issue = await Issue.findById(id).populate('user_id', 'name').lean();
    if (!issue) return null;
    const [formatted] = await formatIssues([issue]);
    return formatted;
  },

  async findDocumentById(id) {
    return Issue.findById(id);
  },

  async existsById(id) {
    return Issue.exists({ _id: id });
  },

  async create(data) {
    return Issue.create(data);
  },

  async updateStatus(id, status) {
    return Issue.findByIdAndUpdate(id, { status }, { new: true });
  },

  async updateContent(id, updates) {
    const issue = await Issue.findByIdAndUpdate(id, updates, { new: true })
      .populate('user_id', 'name')
      .lean();
    if (!issue) return null;
    const [formatted] = await formatIssues([issue]);
    return formatted;
  },
});

module.exports = { createIssueRepository };