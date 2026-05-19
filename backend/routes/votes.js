const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { VoteServiceError, createVoteService } = require('../services/voteService');

const voteService = createVoteService();

function handleVoteError(error, res) {
  if (error instanceof VoteServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error('Vote toggle error:', error);
  return res.status(500).json({ error: 'Failed to process vote' });
}

// POST /api/votes/:issueId — toggle vote (add if not voted, remove if already voted)
router.post('/:issueId', verifyToken, async (req, res) => {
  try {
    const result = await voteService.toggleVote({
      issueId: req.params.issueId,
      userId: req.user.id
    });

    const { statusCode, ...body } = result;
    res.status(statusCode).json(body);
  } catch (error) {
    handleVoteError(error, res);
  }
});

module.exports = router;
