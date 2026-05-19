const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { VoteServiceError, createVoteService } = require('../services/voteService');

function handleVoteError(error, res) {
  if (error instanceof VoteServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error('Vote toggle error:', error);
  return res.status(500).json({ error: 'Failed to process vote' });
}

const buildVoteRouter = ({
  voteService = createVoteService(),
  authMiddleware = verifyToken
} = {}) => {
  const router = express.Router();

  // POST /api/votes/:issueId — toggle vote (add if not voted, remove if already voted)
  router.post('/:issueId', authMiddleware, async (req, res) => {
    try {
      const result = await voteService.toggleVote({
        issueId: req.params.issueId,
        userId: req.user.id
      });

      return res.status(result.voted ? 201 : 200).json(result);
    } catch (error) {
      return handleVoteError(error, res);
    }
  });

  return router;
};

module.exports = buildVoteRouter();
module.exports.buildVoteRouter = buildVoteRouter;
