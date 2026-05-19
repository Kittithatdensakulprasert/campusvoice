const { createIssueRepository } = require('../repositories/issueRepository');
const { createVoteRepository } = require('../repositories/voteRepository');

class VoteError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'VoteError';
    this.statusCode = statusCode;
  }
}

const createVoteService = ({
  issueRepository = createIssueRepository(),
  voteRepository  = createVoteRepository(),
} = {}) => ({
  async toggleVote(userId, issueId) {
    const exists = await issueRepository.existsById(issueId);
    if (!exists) throw new VoteError('Issue not found', 404);

    const existing = await voteRepository.findByUserAndIssue(userId, issueId);

    if (existing) {
      await voteRepository.deleteByUserAndIssue(userId, issueId);
      const voteCount = await voteRepository.countByIssue(issueId);
      return { message: 'Vote removed', voteCount, voted: false };
    }

    await voteRepository.create(userId, issueId);
    const voteCount = await voteRepository.countByIssue(issueId);
    return { message: 'Voted successfully', voteCount, voted: true };
  },
});

module.exports = { VoteError, createVoteService };