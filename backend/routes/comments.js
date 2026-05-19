const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { CommentServiceError, createCommentService } = require('../services/commentService');

function handleCommentError(error, res, logLabel) {
  if (error instanceof CommentServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(`${logLabel} error:`, error);
  return res.status(500).json({ error: logLabel });
}

const buildCommentRouter = ({
  commentService = createCommentService(),
  authMiddleware = verifyToken
} = {}) => {
  const router = express.Router();

  // GET /api/comments/:issueId
  router.get('/:issueId', async (req, res) => {
    try {
      return res.json(await commentService.listComments(req.params.issueId));
    } catch (error) {
      return handleCommentError(error, res, 'Failed to load comments');
    }
  });

  // POST /api/comments/:issueId
  router.post('/:issueId', authMiddleware, async (req, res) => {
    try {
      const result = await commentService.createComment({
        issueId: req.params.issueId,
        userId: req.user.id,
        body: req.body.body
      });

      return res.status(201).json(result);
    } catch (error) {
      return handleCommentError(error, res, 'Failed to add comment');
    }
  });

  // PATCH /api/comments/:id
  router.patch('/:id', authMiddleware, async (req, res) => {
    try {
      return res.json(await commentService.updateComment({
        id: req.params.id,
        user: req.user,
        body: req.body?.body
      }));
    } catch (error) {
      return handleCommentError(error, res, 'Failed to update comment');
    }
  });

  // DELETE /api/comments/:id
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      return res.json(await commentService.deleteComment({
        id: req.params.id,
        user: req.user
      }));
    } catch (error) {
      return handleCommentError(error, res, 'Failed to delete comment');
    }
  });

  return router;
};

module.exports = buildCommentRouter();
module.exports.buildCommentRouter = buildCommentRouter;
