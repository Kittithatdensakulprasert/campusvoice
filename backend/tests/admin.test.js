const test = require('node:test');
const assert = require('node:assert/strict');

const adminRouter = require('../routes/admin');
const User = require('../models/User');
const Issue = require('../models/Issue');

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
  return adminRouter.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  ).route;
}

function getFinalHandler(path, method) {
  const route = getRoute(path, method);
  return route.stack[route.stack.length - 1].handle;
}

test('admin GET /users returns user list with normalized ids', async (t) => {
  const handler = getFinalHandler('/users', 'get');
  const originalFind = User.find;

  User.find = () => ({
    select() { return this; },
    sort() { return this; },
    async lean() {
      return [
        { _id: '507f1f77bcf86cd799439011', email: 'a@example.com', role: 'user' },
        { id: 'legacy-id', email: 'b@example.com', role: 'admin' }
      ];
    }
  });

  t.after(() => {
    User.find = originalFind;
  });

  const req = { user: { id: 'admin-id', role: 'admin' } };
  const res = createResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.users.length, 2);
  assert.equal(res.body.users[0].id, '507f1f77bcf86cd799439011');
  assert.equal(res.body.users[1].id, 'legacy-id');
});

test('admin GET /users returns 500 when query fails', async (t) => {
  const handler = getFinalHandler('/users', 'get');
  const originalFind = User.find;

  User.find = () => {
    throw new Error('boom');
  };

  t.after(() => {
    User.find = originalFind;
  });

  const res = createResponse();
  await handler({ user: { id: 'admin-id', role: 'admin' } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Failed to load users' });
});
