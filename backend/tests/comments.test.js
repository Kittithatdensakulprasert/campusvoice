const test = require('node:test');
const assert = require('node:assert/strict');

const commentsRouter = require('../routes/comments');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; }
});

function getFinalHandler(path, method) {
  const route = commentsRouter.stack.find((e) => e.route && e.route.path === path && e.route.methods[method]).route;
  return route.stack[route.stack.length - 1].handle;
}

test('comments GET: invalid id and success mapping', async (t) => {
  const handler = getFinalHandler('/:issueId', 'get');

  const badRes = createResponse();
  await handler({ params: { issueId: 'bad-id' } }, badRes);
  assert.equal(badRes.statusCode, 400);

  const originalFind = Comment.find;
  Comment.find = () => ({
    populate() { return this; },
    sort() { return this; },
    async lean() {
      return [{ _id: 'c1', body: 'First', created_at: new Date(), updated_at: new Date(), user_id: { _id: 'u1', name: 'Alice' } }];
    }
  });

  t.after(() => { Comment.find = originalFind; });

  const okRes = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' } }, okRes);
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.body.comments[0].user_name, 'Alice');
});

test('comments GET: returns 500 on db error', async (t) => {
  const handler = getFinalHandler('/:issueId', 'get');
  const originalFind = Comment.find;
  Comment.find = () => ({ populate() { return this; }, sort() { return this; }, async lean() { throw new Error('boom'); } });
  t.after(() => { Comment.find = originalFind; });
  const res = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' } }, res);
  assert.equal(res.statusCode, 500);
});

test('comments POST: validation/not found/success/500', async (t) => {
  const handler = getFinalHandler('/:issueId', 'post');

  const badRes = createResponse();
  await handler({ params: { issueId: 'bad-id' }, body: { body: 'x' }, user: { id: 'u1' } }, badRes);
  assert.equal(badRes.statusCode, 400);

  const emptyRes = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' }, body: { body: '   ' }, user: { id: 'u1' } }, emptyRes);
  assert.equal(emptyRes.statusCode, 400);

  const originalFindById = Issue.findById;
  const originalCreate = Comment.create;

  Issue.findById = async () => null;
  const missRes = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' }, body: { body: 'ok' }, user: { id: 'u1' } }, missRes);
  assert.equal(missRes.statusCode, 404);

  Issue.findById = async () => ({ _id: 'i1' });
  Comment.create = async () => ({
    _id: 'c100',
    body: 'hello',
    created_at: new Date(),
    async populate() { return { _id: 'c100', body: 'hello', created_at: new Date(), user_id: { _id: 'u1', name: 'Alice' } }; }
  });
  const okRes = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' }, body: { body: ' hello ' }, user: { id: 'u1' } }, okRes);
  assert.equal(okRes.statusCode, 201);

  Comment.create = async () => { throw new Error('boom'); };
  const errRes = createResponse();
  await handler({ params: { issueId: '507f1f77bcf86cd799439011' }, body: { body: 'ok' }, user: { id: 'u1' } }, errRes);
  assert.equal(errRes.statusCode, 500);

  t.after(() => {
    Issue.findById = originalFindById;
    Comment.create = originalCreate;
  });
});

test('comments DELETE: invalid/not found/forbidden/success/500', async (t) => {
  const handler = getFinalHandler('/:id', 'delete');
  const badRes = createResponse();
  await handler({ params: { id: 'bad-id' }, user: { id: 'u1', role: 'admin' } }, badRes);
  assert.equal(badRes.statusCode, 400);

  const originalFindById = Comment.findById;
  Comment.findById = async () => null;
  const missRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'u1', role: 'admin' } }, missRes);
  assert.equal(missRes.statusCode, 404);

  Comment.findById = async () => ({ user_id: { toString: () => 'owner-id' } });
  const forbRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'other', role: 'user' } }, forbRes);
  assert.equal(forbRes.statusCode, 403);

  let deleted = false;
  Comment.findById = async () => ({ user_id: { toString: () => 'owner-id' }, async deleteOne() { deleted = true; } });
  const okRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'owner-id', role: 'user' } }, okRes);
  assert.equal(okRes.statusCode, 200);
  assert.equal(deleted, true);

  Comment.findById = async () => { throw new Error('boom'); };
  const errRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'u1', role: 'admin' } }, errRes);
  assert.equal(errRes.statusCode, 500);

  t.after(() => { Comment.findById = originalFindById; });
});

test('comments PATCH: invalid/not found/forbidden/success/500', async (t) => {
  const handler = getFinalHandler('/:id', 'patch');

  const badRes = createResponse();
  await handler({ params: { id: 'bad-id' }, body: { body: 'x' }, user: { id: 'u1', role: 'user' } }, badRes);
  assert.equal(badRes.statusCode, 400);

  const emptyRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, body: { body: '   ' }, user: { id: 'u1', role: 'user' } }, emptyRes);
  assert.equal(emptyRes.statusCode, 400);

  const oFindById = Comment.findById;
  const oFindByIdAndUpdate = Comment.findByIdAndUpdate;

  Comment.findById = async () => null;
  const missRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, body: { body: 'hi' }, user: { id: 'u1', role: 'user' } }, missRes);
  assert.equal(missRes.statusCode, 404);

  Comment.findById = async () => ({ user_id: { toString: () => 'owner-id' } });
  const forbRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, body: { body: 'hi' }, user: { id: 'other', role: 'user' } }, forbRes);
  assert.equal(forbRes.statusCode, 403);

  Comment.findByIdAndUpdate = () => ({
    populate() { return this; },
    async lean() {
      return {
        _id: 'c1',
        body: 'updated',
        created_at: new Date(),
        updated_at: new Date(),
        user_id: { _id: 'owner-id', name: 'Owner' }
      };
    }
  });
  const okRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, body: { body: 'updated' }, user: { id: 'owner-id', role: 'user' } }, okRes);
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.body.comment.body, 'updated');

  Comment.findByIdAndUpdate = () => ({
    populate() { return this; },
    async lean() { throw new Error('boom'); }
  });
  const errRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, body: { body: 'updated' }, user: { id: 'owner-id', role: 'user' } }, errRes);
  assert.equal(errRes.statusCode, 500);

  t.after(() => {
    Comment.findById = oFindById;
    Comment.findByIdAndUpdate = oFindByIdAndUpdate;
  });
});
