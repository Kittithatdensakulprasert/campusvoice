const test = require('node:test');
const assert = require('node:assert/strict');

const commentsRouter = require('../routes/comments');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');

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

function getRouteHandler(path, method, index = 0) {
  const layer = commentsRouter.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[index].handle;
}

test('comments GET: returns 400 for invalid issue id', async () => {
  const handler = getRouteHandler('/:issueId', 'get');
  const req = { params: { issueId: 'bad-id' } };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Invalid issue ID' });
});

test('comments GET: maps comment payload correctly', async (t) => {
  const handler = getRouteHandler('/:issueId', 'get');
  const originalFind = Comment.find;

  Comment.find = () => ({
    populate() { return this; },
    sort() { return this; },
    async lean() {
      return [
        {
          _id: 'c1',
          body: 'First',
          created_at: new Date('2026-01-01T00:00:00.000Z'),
          updated_at: new Date('2026-01-01T00:00:00.000Z'),
          user_id: { _id: 'u1', name: 'Alice' }
        }
      ];
    }
  });

  t.after(() => {
    Comment.find = originalFind;
  });

  const req = { params: { issueId: '507f1f77bcf86cd799439011' } };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.comments.length, 1);
  assert.equal(res.body.comments[0].id, 'c1');
  assert.equal(res.body.comments[0].user_name, 'Alice');
});

test('comments POST: rejects empty comment body', async () => {
  const handler = getRouteHandler('/:issueId', 'post', 1);
  const req = {
    params: { issueId: '507f1f77bcf86cd799439011' },
    body: { body: '   ' },
    user: { id: 'u1' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Comment body is required' });
});

test('comments POST: returns 404 when issue is missing', async (t) => {
  const handler = getRouteHandler('/:issueId', 'post', 1);
  const originalFindById = Issue.findById;
  Issue.findById = async () => null;

  t.after(() => {
    Issue.findById = originalFindById;
  });

  const req = {
    params: { issueId: '507f1f77bcf86cd799439011' },
    body: { body: 'hello' },
    user: { id: 'u1' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Issue not found' });
});

test('comments POST: creates and returns comment payload', async (t) => {
  const handler = getRouteHandler('/:issueId', 'post', 1);
  const originalFindById = Issue.findById;
  const originalCreate = Comment.create;

  Issue.findById = async () => ({ _id: '507f1f77bcf86cd799439011' });
  Comment.create = async () => ({
    _id: 'c100',
    body: 'hello world',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    async populate() {
      return {
        _id: 'c100',
        body: 'hello world',
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        user_id: { _id: 'u1', name: 'Alice' }
      };
    }
  });

  t.after(() => {
    Issue.findById = originalFindById;
    Comment.create = originalCreate;
  });

  const req = {
    params: { issueId: '507f1f77bcf86cd799439011' },
    body: { body: ' hello world ' },
    user: { id: 'u1' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, 'Comment added');
  assert.equal(res.body.comment.user_name, 'Alice');
});

test('comments DELETE: returns 403 for non-owner non-admin', async (t) => {
  const handler = getRouteHandler('/:id', 'delete', 1);
  const originalFindById = Comment.findById;

  Comment.findById = async () => ({
    user_id: { toString: () => 'owner-id' }
  });

  t.after(() => {
    Comment.findById = originalFindById;
  });

  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    user: { id: 'another-user', role: 'user' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'Forbidden' });
});

test('comments DELETE: allows admin to delete', async (t) => {
  const handler = getRouteHandler('/:id', 'delete', 1);
  const originalFindById = Comment.findById;

  let deleted = false;
  Comment.findById = async () => ({
    user_id: { toString: () => 'owner-id' },
    async deleteOne() {
      deleted = true;
    }
  });

  t.after(() => {
    Comment.findById = originalFindById;
  });

  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    user: { id: 'admin-id', role: 'admin' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(deleted, true);
  assert.deepEqual(res.body, { message: 'Comment deleted' });
});
