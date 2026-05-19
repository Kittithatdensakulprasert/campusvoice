const test = require('node:test');
const assert = require('node:assert/strict');

const issuesRouter = require('../routes/issues');
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

function getRoute(path, method) {
  return issuesRouter.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  ).route;
}

function getFinalHandler(path, method) {
  const route = getRoute(path, method);
  return route.stack[route.stack.length - 1].handle;
}

test('issues GET / returns issues for default sort', async (t) => {
  const handler = getFinalHandler('/', 'get');
  const originalFind = Issue.find;
  const originalAggregate = Vote.aggregate;

  Issue.find = () => ({
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    async lean() { return [{ _id: 'i1' }]; }
  });
  Vote.aggregate = async () => [];

  t.after(() => {
    Issue.find = originalFind;
    Vote.aggregate = originalAggregate;
  });

  const req = { query: {}, headers: {} };
  const res = createResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body[0].id, 'i1');
});

test('issues GET / returns 500 when listing fails', async (t) => {
  const handler = getFinalHandler('/', 'get');
  const originalFind = Issue.find;
  Issue.find = () => { throw new Error('boom'); };

  t.after(() => {
    Issue.find = originalFind;
  });

  const req = { query: {}, headers: {} };
  const res = createResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Failed to load issues' });
});

test('issues GET /search returns search payload', async (t) => {
  const handler = getFinalHandler('/search', 'get');
  const originalFind = Issue.find;
  const originalAggregate = Vote.aggregate;

  Issue.find = () => ({
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    async lean() { return [{ _id: 'i2' }]; }
  });
  Vote.aggregate = async () => [];

  t.after(() => {
    Issue.find = originalFind;
    Vote.aggregate = originalAggregate;
  });

  const req = { query: { q: 'wifi', sort: 'votes' } };
  const res = createResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.issues[0].id, 'i2');
});

test('issues GET /search returns 500 when search fails', async (t) => {
  const handler = getFinalHandler('/search', 'get');
  const originalFind = Issue.find;
  Issue.find = () => { throw new Error('boom'); };

  t.after(() => {
    Issue.find = originalFind;
  });

  const req = { query: { q: 'wifi' } };
  const res = createResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Failed to search issues' });
});

test('issues GET /:id returns 400 when id is invalid', async () => {
  const handler = getFinalHandler('/:id', 'get');
  const req = { params: { id: 'bad-id' }, headers: {} };
  const res = createResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test('issues GET /:id returns 404 when issue is missing', async (t) => {
  const handler = getFinalHandler('/:id', 'get');
  const originalFindById = Issue.findById;
  Issue.findById = () => ({ populate() { return this; }, async lean() { return null; } });

  t.after(() => {
    Issue.findById = originalFindById;
  });

  const req = { params: { id: '507f1f77bcf86cd799439011' }, headers: {} };
  const res = createResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Issue not found' });
});

test('issues GET /:id returns 500 on unexpected error', async (t) => {
  const handler = getFinalHandler('/:id', 'get');
  const originalFindById = Issue.findById;
  Issue.findById = () => ({ populate() { return this; }, async lean() { throw new Error('boom'); } });

  t.after(() => {
    Issue.findById = originalFindById;
  });

  const req = { params: { id: '507f1f77bcf86cd799439011' }, headers: {} };
  const res = createResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 500);
});

test('issues POST / rejects title too long and description too long', async () => {
  const handler = getFinalHandler('/', 'post');

  const req1 = { body: { title: 'a'.repeat(101), description: 'ok' }, user: { id: 'u1' } };
  const res1 = createResponse();
  await handler(req1, res1);
  assert.equal(res1.statusCode, 400);

  const req2 = { body: { title: 'ok', description: 'd'.repeat(501) }, user: { id: 'u1' } };
  const res2 = createResponse();
  await handler(req2, res2);
  assert.equal(res2.statusCode, 400);
});

test('issues PATCH /:id/status rejects invalid status', async () => {
  const handler = getFinalHandler('/:id/status', 'patch');
  const req = { params: { id: '507f1f77bcf86cd799439011' }, body: { status: 'unknown' } };
  const res = createResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test('issues PATCH /:id/status returns 404 when issue not found', async (t) => {
  const handler = getFinalHandler('/:id/status', 'patch');
  const original = Issue.findByIdAndUpdate;
  Issue.findByIdAndUpdate = async () => null;
  t.after(() => {
    Issue.findByIdAndUpdate = original;
  });

  const req = { params: { id: '507f1f77bcf86cd799439011' }, body: { status: 'resolved' } };
  const res = createResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 404);
});

test('issues DELETE /:id returns 404 when issue missing', async (t) => {
  const handler = getFinalHandler('/:id', 'delete');
  const originalFindById = Issue.findById;
  Issue.findById = async () => null;

  t.after(() => {
    Issue.findById = originalFindById;
  });

  const req = { params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'x', role: 'admin' } };
  const res = createResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 404);
});

test('issues DELETE /:id allows owner to delete', async (t) => {
  const handler = getFinalHandler('/:id', 'delete');
  const originalFindById = Issue.findById;
  let deleted = false;

  Issue.findById = async () => ({
    user_id: { toString: () => 'owner-id' },
    image_url: null,
    async deleteOne() {
      deleted = true;
    }
  });

  t.after(() => {
    Issue.findById = originalFindById;
  });

  const req = { params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'owner-id', role: 'user' } };
  const res = createResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(deleted, true);
});

test('issues GET / with sort=votes uses vote ranking branch', async (t) => {
  const handler = getFinalHandler('/', 'get');
  const oIssueFind = Issue.find;
  const oVoteAgg = Vote.aggregate;

  Vote.aggregate = async () => [{ _id: 'i2', count: 2 }, { _id: 'i1', count: 1 }];
  Issue.find = () => ({
    populate() { return this; },
    async lean() {
      return [{ _id: 'i1' }, { _id: 'i2' }];
    }
  });

  t.after(() => {
    Issue.find = oIssueFind;
    Vote.aggregate = oVoteAgg;
  });

  const res = createResponse();
  await handler({ query: { sort: 'votes' }, headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body[0].id, 'i2');
});

test('issues GET /:id includes voted=true when token has vote', async (t) => {
  const handler = getFinalHandler('/:id', 'get');
  const oFindById = Issue.findById;
  const oFindOne = Vote.findOne;
  const oAggregate = Vote.aggregate;
  const jwt = require('jsonwebtoken');

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET);

  Issue.findById = () => ({ populate() { return this; }, async lean() { return { _id: '507f1f77bcf86cd799439011' }; } });
  Vote.findOne = async () => ({ _id: 'v1' });
  Vote.aggregate = async () => [];

  t.after(() => {
    Issue.findById = oFindById;
    Vote.findOne = oFindOne;
    Vote.aggregate = oAggregate;
  });

  const res = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, headers: { authorization: `Bearer ${token}` } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.voted, true);
});

test('issues POST / create success and 500 path', async (t) => {
  const handler = getFinalHandler('/', 'post');
  const oCreate = Issue.create;

  Issue.create = async () => ({ _id: 'i10', title: 'title', status: 'open', image_url: null });
  const okRes = createResponse();
  await handler({ body: { title: ' title ', description: ' desc ' }, user: { id: 'u1' } }, okRes);
  assert.equal(okRes.statusCode, 201);

  Issue.create = async () => { throw new Error('boom'); };
  const errRes = createResponse();
  await handler({ body: { title: 'title', description: 'desc' }, user: { id: 'u1' } }, errRes);
  assert.equal(errRes.statusCode, 500);

  t.after(() => { Issue.create = oCreate; });
});

test('issues PATCH /:id/status invalid id and 500', async (t) => {
  const handler = getFinalHandler('/:id/status', 'patch');
  const badRes = createResponse();
  await handler({ params: { id: 'bad-id' }, body: { status: 'resolved' } }, badRes);
  assert.equal(badRes.statusCode, 400);

  const oUpdate = Issue.findByIdAndUpdate;
  Issue.findByIdAndUpdate = async () => { throw new Error('boom'); };
  const errRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, body: { status: 'resolved' } }, errRes);
  assert.equal(errRes.statusCode, 500);
  t.after(() => { Issue.findByIdAndUpdate = oUpdate; });
});

test('issues DELETE /:id invalid id, forbidden, and 500', async (t) => {
  const handler = getFinalHandler('/:id', 'delete');

  const badRes = createResponse();
  await handler({ params: { id: 'bad-id' }, user: { id: 'u1', role: 'admin' } }, badRes);
  assert.equal(badRes.statusCode, 400);

  const oFindById = Issue.findById;
  Issue.findById = async () => ({ user_id: { toString: () => 'owner-id' } });
  const forbRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'other', role: 'user' } }, forbRes);
  assert.equal(forbRes.statusCode, 403);

  Issue.findById = async () => { throw new Error('boom'); };
  const errRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'u1', role: 'admin' } }, errRes);
  assert.equal(errRes.statusCode, 500);

  t.after(() => { Issue.findById = oFindById; });
});
