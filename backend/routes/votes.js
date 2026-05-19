const express = require('express');
const mongoose = require('mongoose');
const verifyToken = require('../middleware/verifyToken');
const { VoteError, createVoteService } = require('../services/voteService');

function handleError(err, res) {
  if (err instanceof VoteError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('Vote route error:', err);
  return res.status(500).json({ error: 'Failed to process vote' });
}

const buildVoteRouter = ({ voteService = createVoteService() } = {}) => {
  const router = express.Router();

  // POST /api/votes/:issueId — toggle vote (โหวต/ยกเลิกโหวต)
  router.post('/:issueId', verifyToken, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.issueId)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    try {
      const result = await voteService.toggleVote(req.user.id, req.params.issueId);
      res.status(result.voted ? 201 : 200).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  return router;
};

module.exports = buildVoteRouter();
module.exports.buildVoteRouter = buildVoteRouter;