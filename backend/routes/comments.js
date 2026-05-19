const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const verifyToken = require('../middleware/verifyToken');
const { CommentError, createCommentService } = require('../services/commentService');

const commentService = createCommentService();

function handleError(err, res) {
  if (err instanceof CommentError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('Comment route error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}

// GET /api/comments/:issueId
router.get('/:issueId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }
  try {
    res.json(await commentService.getComments(req.params.issueId));
  } catch (err) {
    handleError(err, res);
  }
});

// POST /api/comments/:issueId
router.post('/:issueId', verifyToken, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }
  try {
    const result = await commentService.addComment(req.user.id, req.params.issueId, req.body.body);
    res.status(201).json(result);
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE /api/comments/:id
router.delete('/:id', verifyToken, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }
  try {
    res.json(await commentService.deleteComment(req.params.id, req.user));
  } catch (err) {
    handleError(err, res);
  }
});

module.exports = router;