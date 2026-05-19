const Comment = require('../models/Comment');

const createCommentRepository = () => ({
  async findByIssue(issueId) {
    return Comment.find({ issue_id: issueId })
      .populate('user_id', 'name')
      .sort({ created_at: 1 })
      .lean();
  },

  // คืนค่า Mongoose Document สำหรับเช็ค ownership และ deleteOne()
  async findDocumentById(id) {
    return Comment.findById(id);
  },

  async create(userId, issueId, body) {
    const comment = await Comment.create({ user_id: userId, issue_id: issueId, body });
    return comment.populate('user_id', 'name');
  },
});

module.exports = { createCommentRepository };