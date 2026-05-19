const Comment = require('../models/Comment');

const createCommentRepository = () => ({
  async findByIssueId(issueId) {
    return Comment.find({ issue_id: issueId })
      .populate('user_id', 'name')
      .sort({ created_at: 1 })
      .lean();
  },

  async createComment({ userId, issueId, body }) {
    const comment = await Comment.create({
      user_id: userId,
      issue_id: issueId,
      body,
    });

    return comment.populate('user_id', 'name');
  },

  async findById(id) {
    return Comment.findById(id);
  },

  async updateComment(id, body) {
    return Comment.findByIdAndUpdate(
      id,
      { body },
      { new: true }
    )
      .populate('user_id', 'name')
      .lean();
  }
});

module.exports = { createCommentRepository };
