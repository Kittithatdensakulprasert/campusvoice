const express = require('express');
const router = express.Router();
// const pool = require('../db');
// const verifyToken = require('../middleware/verifyToken');

// POST /api/votes/:issueId — toggle vote on an issue (1 user = 1 vote)
router.post('/:issueId', async (req, res) => {
  // TODO: Feature 4 — verifyToken, insert or delete vote record
  res.status(501).json({ message: 'Vote endpoint — not yet implemented' });
});

// DELETE /api/votes/:issueId — remove vote
router.delete('/:issueId', async (req, res) => {
  // TODO: Feature 4 — verifyToken, delete vote record
  res.status(501).json({ message: 'Remove vote — not yet implemented' });
});

module.exports = router;
