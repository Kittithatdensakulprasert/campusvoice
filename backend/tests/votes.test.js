const test = require('node:test');
const assert = require('node:assert/strict');

const votesRouter = require('../routes/votes');
const Issue = require('../models/Issue');
const Vote = require('../models/Vote');

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

function getVoteHandler() {
  const layer = votesRouter.stack.find(
    (entry) => entry.route && entry.route.path === '/:issueId' && entry.route.methods.post
  );
  return layer.route.stack[1].handle;
}

test('votes: returns 400 when issue id is invalid', async () => {
  const handler = getVoteHandler();
  const req = { params: { issueId: 'bad-id' }, user: { id: 'u1' } };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Invalid issue ID' });
});

test('votes: returns 404 when issue is not found', async (t) => {
  const handler = getVoteHandler();
  const originalFindById = Issue.findById;
  Issue.findById = async () => null;
  t.after(() => {
    Issue.findById = originalFindById;
  });

  const req = { params: { issueId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Issue not found' });
});

test('votes: removes existing vote on toggle off', async (t) => {
  const handler = getVoteHandler();
  const originalFindById = Issue.findById;
  const originalFindOne = Vote.findOne;
  const originalDeleteOne = Vote.deleteOne;
  const originalCountDocuments = Vote.countDocuments;

  Issue.findById = async () => ({ _id: '507f1f77bcf86cd799439011' });
  Vote.findOne = async () => ({ _id: 'vote-1' });
  Vote.deleteOne = async () => ({ deletedCount: 1 });
  Vote.countDocuments = async () => 3;

  t.after(() => {
    Issue.findById = originalFindById;
    Vote.findOne = originalFindOne;
    Vote.deleteOne = originalDeleteOne;
    Vote.countDocuments = originalCountDocuments;
  });

  const req = { params: { issueId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'Vote removed', voteCount: 3, voted: false });
});

test('votes: creates vote on toggle on', async (t) => {
  const handler = getVoteHandler();
  const originalFindById = Issue.findById;
  const originalFindOne = Vote.findOne;
  const originalCreate = Vote.create;
  const originalCountDocuments = Vote.countDocuments;

  Issue.findById = async () => ({ _id: '507f1f77bcf86cd799439011' });
  Vote.findOne = async () => null;
  Vote.create = async () => ({ _id: 'vote-2' });
  Vote.countDocuments = async () => 4;

  t.after(() => {
    Issue.findById = originalFindById;
    Vote.findOne = originalFindOne;
    Vote.create = originalCreate;
    Vote.countDocuments = originalCountDocuments;
  });

  const req = { params: { issueId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { message: 'Voted successfully', voteCount: 4, voted: true });
});
