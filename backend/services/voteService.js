const mongoose = require('mongoose');
const { createIssueRepository } = require('../repositories/issueRepository');
const { createVoteRepository } = require('../repositories/voteRepository');

class VoteServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'VoteServiceError';
    this.statusCode = statusCode;
  }
}

const createVoteService = ({
  issueRepository = createIssueRepository(),
  voteRepository = createVoteRepository()
} = {}) => ({
  async toggleVote({ issueId, userId }) {
    if (!mongoose.isValidObjectId(issueId)) {
      throw new VoteServiceError('Invalid issue ID', 400);
    }

    const issue = await issueRepository.findIssueDocumentById(issueId);
    if (!issue) {
      throw new VoteServiceError('Issue not found', 404);
    }

    const existing = await voteRepository.findByUserAndIssue(userId, issueId);
    if (existing) {
      await voteRepository.deleteVoteById(existing._id);
      const voteCount = await voteRepository.countVotesByIssueId(issueId);
      return { message: 'Vote removed', voteCount, voted: false };
    }

    await voteRepository.createVote(userId, issueId);
    const voteCount = await voteRepository.countVotesByIssueId(issueId);
    return { message: 'Voted successfully', voteCount, voted: true };
  }
});

module.exports = { VoteServiceError, createVoteService };
