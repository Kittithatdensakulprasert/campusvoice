const express = require('express');
const router = express.Router();
// const pool = require('../db');
// const verifyToken = require('../middleware/verifyToken');

// GET /api/comments/:issueId — get comments for an issue
router.get('/:issueId', async (req, res) => {
  // TODO: Feature 4
  res.status(501).json({ message: 'Get comments — not yet implemented' });
});

// POST /api/comments/:issueId — add comment (auth required)
router.post('/:issueId', async (req, res) => {
  // TODO: Feature 4 — verifyToken required
  res.status(501).json({ message: 'Add comment — not yet implemented' });
});

// DELETE /api/comments/:id — delete own comment or admin delete
router.delete('/:id', async (req, res) => {
  // TODO: Feature 4 — verifyToken, check ownership or roleGuard
  res.status(501).json({ message: 'Delete comment — not yet implemented' });
});

module.exports = router;
