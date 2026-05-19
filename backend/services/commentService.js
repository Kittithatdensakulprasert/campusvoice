const mongoose = require('mongoose');
const { createCommentRepository } = require('../repositories/commentRepository');
const { createIssueRepository } = require('../repositories/issueRepository');

class CommentServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'CommentServiceError';
    this.statusCode = statusCode;
  }
}

function serializeComment(comment) {
  return {
    id: comment._id,
    body: comment.body,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    user_id: comment.user_id?._id,
    user_name: comment.user_id?.name,
  };
}

const createCommentService = ({
  commentRepository = createCommentRepository(),
  issueRepository = createIssueRepository()
} = {}) => ({
  async listComments(issueId) {
    if (!mongoose.isValidObjectId(issueId)) {
      throw new CommentServiceError('Invalid issue ID', 400);
    }

    const comments = await commentRepository.findByIssueId(issueId);
    return { comments: comments.map(serializeComment) };
  },

  async createComment({ issueId, userId, body }) {
    if (!mongoose.isValidObjectId(issueId)) {
      throw new CommentServiceError('Invalid issue ID', 400);
    }

    const normalizedBody = String(body || '').trim();
    if (!normalizedBody) {
      throw new CommentServiceError('Comment body is required', 400);
    }

    const issue = await issueRepository.findIssueDocumentById(issueId);
    if (!issue) {
      throw new CommentServiceError('Issue not found', 404);
    }

    const comment = await commentRepository.createComment({
      userId,
      issueId,
      body: normalizedBody,
    });

    return {
      message: 'Comment added',
      comment: serializeComment(comment),
    };
  },

  async deleteComment({ id, user }) {
    if (!mongoose.isValidObjectId(id)) {
      throw new CommentServiceError('Invalid comment ID', 400);
    }

    const comment = await commentRepository.findById(id);
    if (!comment) {
      throw new CommentServiceError('Comment not found', 404);
    }

    if (comment.user_id.toString() !== user.id && user.role !== 'admin') {
      throw new CommentServiceError('Forbidden', 403);
    }

    await comment.deleteOne();
    return { message: 'Comment deleted' };
  }
});

module.exports = { CommentServiceError, createCommentService };
