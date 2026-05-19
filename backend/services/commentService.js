const { createIssueRepository } = require('../repositories/issueRepository');
const { createCommentRepository } = require('../repositories/commentRepository');

class CommentError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'CommentError';
    this.statusCode = statusCode;
  }
}

const createCommentService = ({
  issueRepository   = createIssueRepository(),
  commentRepository = createCommentRepository(),
} = {}) => ({
  async getComments(issueId) {
    const comments = await commentRepository.findByIssue(issueId);
    return {
      comments: comments.map(c => ({
        id:         c._id,
        body:       c.body,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user_id:    c.user_id?._id,
        user_name:  c.user_id?.name,
      })),
    };
  },

  async addComment(userId, issueId, body) {
    if (!body || body.trim() === '') throw new CommentError('Comment body is required', 400);

    const exists = await issueRepository.existsById(issueId);
    if (!exists) throw new CommentError('Issue not found', 404);

    const comment = await commentRepository.create(userId, issueId, body.trim());

    return {
      message: 'Comment added',
      comment: {
        id:         comment._id,
        body:       comment.body,
        created_at: comment.created_at,
        user_id:    comment.user_id._id,
        user_name:  comment.user_id.name,
      },
    };
  },

  async deleteComment(commentId, requestingUser) {
    const comment = await commentRepository.findDocumentById(commentId);
    if (!comment) throw new CommentError('Comment not found', 404);

    const isOwner = comment.user_id.toString() === requestingUser.id;
    const isAdmin = requestingUser.role === 'admin';
    if (!isOwner && !isAdmin) throw new CommentError('Forbidden', 403);

    await comment.deleteOne();
    return { message: 'Comment deleted' };
  },
});

module.exports = { CommentError, createCommentService };