const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Vote = require('../models/Vote');
const verifyToken = require('../middleware/verifyToken');

function validId(id) {
  return mongoose.isValidObjectId(id);
}

// POST /api/votes/:issueId — toggle vote
router.post('/:issueId', verifyToken, async (req, res) => {
  const { issueId } = req.params;
  if (!validId(issueId)) return res.status(400).json({ error: 'Invalid issue ID' });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/votes/:issueId — ยกเลิก vote
router.delete('/:issueId', verifyToken, async (req, res) => {
  const { issueId } = req.params;
  if (!validId(issueId)) return res.status(400).json({ error: 'Invalid issue ID' });
  const userId = req.user.id;

  try {
    const result = await Vote.deleteOne({ user_id: userId, issue_id: issueId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Vote not found' });

    const voteCount = await Vote.countDocuments({ issue_id: issueId });
    res.json({ message: 'Vote removed', voteCount, voted: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;