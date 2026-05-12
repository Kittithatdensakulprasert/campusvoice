const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const verifyToken = require('../middleware/verifyToken');

// GET /api/comments/:issueId
router.get('/:issueId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  try {
    const comments = await Comment.find({ issue_id: req.params.issueId })
      .populate('user_id', 'name')
      .sort({ created_at: 1 })
      .lean();

    res.json({
      comments: comments.map(c => ({
        id:         c._id,
        body:       c.body,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user_id:    c.user_id?._id,
        user_name:  c.user_id?.name,
      })),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// POST /api/comments/:issueId
router.post('/:issueId', verifyToken, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  const { body } = req.body;
  if (!body || body.trim() === '') {
    return res.status(400).json({ error: 'Comment body is required' });
  }

  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const comment = await Comment.create({
      user_id:  req.user.id,
      issue_id: req.params.issueId,
      body:     body.trim(),
    });

    const populated = await comment.populate('user_id', 'name');

    res.status(201).json({
      message: 'Comment added',
      comment: {
        id:         populated._id,
        body:       populated.body,
        created_at: populated.created_at,
        user_id:    populated.user_id._id,
        user_name:  populated.user_id.name,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', verifyToken, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
