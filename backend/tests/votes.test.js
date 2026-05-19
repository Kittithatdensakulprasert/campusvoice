const test = require('node:test');
const assert = require('node:assert/strict');

const votesRouter = require('../routes/votes');
const Issue = require('../models/Issue');
const Vote = require('../models/Vote');

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; }
});

function getFinalHandler() {
  const route = votesRouter.stack.find((e) => e.route && e.route.path === '/:issueId' && e.route.methods.post).route;
  return route.stack[route.stack.length - 1].handle;
}

test('votes: invalid id and issue not found', async (t) => {
  const handler = getFinalHandler();

  const badRes = createResponse();
  await handler({ params: { issueId: 'bad-id' }, user: { id: 'u1' } }, badRes);
  assert.equal(badRes.statusCode, 400);

  const originalFindById = Issue.findById;
  Issue.findById = async () => null;
  const missRes = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } }, missRes);
  assert.equal(missRes.statusCode, 404);

  t.after(() => { Issue.findById = originalFindById; });
});

test('votes: toggle off existing vote', async (t) => {
  const handler = getFinalHandler();
  const oFindById = Issue.findById;
  const oFindOne = Vote.findOne;
  const oDelete = Vote.deleteOne;
  const oCount = Vote.countDocuments;

  Issue.findById = async () => ({ _id: 'i1' });
  Vote.findOne = async () => ({ _id: 'v1' });
  Vote.deleteOne = async () => ({ deletedCount: 1 });
  Vote.countDocuments = async () => 3;

  t.after(() => {
    Issue.findById = oFindById;
    Vote.findOne = oFindOne;
    Vote.deleteOne = oDelete;
    Vote.countDocuments = oCount;
  });

  const res = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.voted, false);
});

test('votes: toggle on creates vote', async (t) => {
  const handler = getFinalHandler();
  const oFindById = Issue.findById;
  const oFindOne = Vote.findOne;
  const oCreate = Vote.create;
  const oCount = Vote.countDocuments;

  Issue.findById = async () => ({ _id: 'i1' });
  Vote.findOne = async () => null;
  Vote.create = async () => ({ _id: 'v2' });
  Vote.countDocuments = async () => 5;

  t.after(() => {
    Issue.findById = oFindById;
    Vote.findOne = oFindOne;
    Vote.create = oCreate;
    Vote.countDocuments = oCount;
  });

  const res = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.voted, true);
});

test('votes: returns 500 on unexpected error', async (t) => {
  const handler = getFinalHandler();
  const originalFindById = Issue.findById;
  Issue.findById = async () => { throw new Error('boom'); };

  t.after(() => { Issue.findById = originalFindById; });

  const res = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } }, res);
  assert.equal(res.statusCode, 500);
});
