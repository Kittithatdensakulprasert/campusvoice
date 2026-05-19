const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { CommentServiceError, createCommentService } = require('../services/commentService');

const commentService = createCommentService();

function handleCommentError(error, res, logLabel) {
  if (error instanceof CommentServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(`${logLabel} error:`, error);
  return res.status(500).json({ error: logLabel });
}

// GET /api/comments/:issueId
router.get('/:issueId', async (req, res) => {
  try {
    res.json(await commentService.listComments(req.params.issueId));
  } catch (error) {
    handleCommentError(error, res, 'Failed to load comments');
  }
});

// POST /api/comments/:issueId
router.post('/:issueId', verifyToken, async (req, res) => {
  try {
    const result = await commentService.createComment({
      issueId: req.params.issueId,
      userId: req.user.id,
      body: req.body.body
    });

    res.status(201).json(result);
  } catch (error) {
    handleCommentError(error, res, 'Failed to add comment');
  }
});

// DELETE /api/comments/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    res.json(await commentService.deleteComment({
      id: req.params.id,
      user: req.user
    }));
  } catch (error) {
    handleCommentError(error, res, 'Failed to delete comment');
  }
});

module.exports = router;
