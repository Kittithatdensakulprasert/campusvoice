const test = require('node:test');
const assert = require('node:assert/strict');

const adminRouter = require('../routes/admin');
const User = require('../models/User');

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; }
});

function getFinalHandler(path, method) {
  const route = adminRouter.stack.find((entry) => entry.route && entry.route.path === path && entry.route.methods[method]).route;
  return route.stack[route.stack.length - 1].handle;
}

test('admin DELETE /users/:id validates id and self delete', async () => {
  const handler = getFinalHandler('/users/:id', 'delete');

  const invalidRes = createResponse();
  await handler({ params: { id: 'bad-id' }, user: { id: 'u1' } }, invalidRes);
  assert.equal(invalidRes.statusCode, 400);

  const selfRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: '507f1f77bcf86cd799439011' } }, selfRes);
  assert.equal(selfRes.statusCode, 400);
});

test('admin DELETE /users/:id handles not found/success/500', async (t) => {
  const handler = getFinalHandler('/users/:id', 'delete');
  const oDelete = User.findByIdAndDelete;

  User.findByIdAndDelete = () => ({
    select() { return this; },
    async lean() { return null; }
  });
  const missRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'admin-id' } }, missRes);
  assert.equal(missRes.statusCode, 404);

  User.findByIdAndDelete = () => ({
    select() { return this; },
    async lean() {
      return { _id: '507f1f77bcf86cd799439011', email: 'a@example.com', name: 'A', role: 'user' };
    }
  });
  const okRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'admin-id' } }, okRes);
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.body.user.id, '507f1f77bcf86cd799439011');

  User.findByIdAndDelete = () => ({
    select() { return this; },
    async lean() { throw new Error('boom'); }
  });
  const errRes = createResponse();
  await handler({ params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'admin-id' } }, errRes);
  assert.equal(errRes.statusCode, 500);

  t.after(() => { User.findByIdAndDelete = oDelete; });
});
