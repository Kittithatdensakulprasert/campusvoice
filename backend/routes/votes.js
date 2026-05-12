const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Vote = require('../models/Vote');
const verifyToken = require('../middleware/verifyToken');

// POST /api/votes/:issueId — toggle vote (add if not voted, remove if already voted)
router.post('/:issueId', verifyToken, async (req, res) => {
  const { issueId } = req.params;

  if (!mongoose.isValidObjectId(issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  const userId = req.user.id;

  try {
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const existing = await Vote.findOne({ user_id: userId, issue_id: issueId });

    if (existing) {
      await Vote.deleteOne({ _id: existing._id });
      const voteCount = await Vote.countDocuments({ issue_id: issueId });
      return res.json({ message: 'Vote removed', voteCount, voted: false });
    }

    await Vote.create({ user_id: userId, issue_id: issueId });
    const voteCount = await Vote.countDocuments({ issue_id: issueId });
    res.status(201).json({ message: 'Voted successfully', voteCount, voted: true });
  } catch (error) {
    console.error('Vote toggle error:', error);
    res.status(500).json({ error: 'Failed to process vote' });
  }
});

module.exports = router;
