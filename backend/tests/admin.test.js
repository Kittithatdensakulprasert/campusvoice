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

test('admin PATCH /users/:id/role validates id and role', async () => {
  const handler = getFinalHandler('/users/:id/role', 'patch');

  const invalidIdRes = createResponse();
  await handler(
    {
      params: { id: 'bad-id' },
      body: { role: 'admin' },
      user: { id: 'admin-id', role: 'admin' }
    },
    invalidIdRes
  );
  assert.equal(invalidIdRes.statusCode, 400);
  assert.deepEqual(invalidIdRes.body, { error: 'Invalid user id' });

  const invalidRoleRes = createResponse();
  await handler(
    {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { role: 'superadmin' },
      user: { id: 'admin-id', role: 'admin' }
    },
    invalidRoleRes
  );
  assert.equal(invalidRoleRes.statusCode, 400);
  assert.deepEqual(invalidRoleRes.body, { error: 'Role must be one of: user, staff, admin' });
});

test('admin PATCH /users/:id/role blocks self-role change', async () => {
  const handler = getFinalHandler('/users/:id/role', 'patch');
  const reqUserId = '507f1f77bcf86cd799439011';
  const res = createResponse();

  await handler(
    {
      params: { id: reqUserId },
      body: { role: 'staff' },
      user: { id: reqUserId, role: 'admin' }
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Cannot change your own role' });
});

test('admin PATCH /users/:id/role returns 404 when user not found', async (t) => {
  const handler = getFinalHandler('/users/:id/role', 'patch');
  const originalUpdate = User.findByIdAndUpdate;

  User.findByIdAndUpdate = () => ({
    select() { return this; },
    async lean() {
      return null;
    }
  });

  t.after(() => {
    User.findByIdAndUpdate = originalUpdate;
  });

  const res = createResponse();
  await handler(
    {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { role: 'staff' },
      user: { id: 'admin-id', role: 'admin' }
    },
    res
  );

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'User not found' });
});

test('admin PATCH /users/:id/role returns updated user payload', async (t) => {
  const handler = getFinalHandler('/users/:id/role', 'patch');
  const originalUpdate = User.findByIdAndUpdate;

  User.findByIdAndUpdate = () => ({
    select() { return this; },
    async lean() {
      return {
        _id: '507f1f77bcf86cd799439011',
        email: 'updated@example.com',
        role: 'staff'
      };
    }
  });

  t.after(() => {
    User.findByIdAndUpdate = originalUpdate;
  });

  const res = createResponse();
  await handler(
    {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { role: 'staff' },
      user: { id: 'admin-id', role: 'admin' }
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Role updated');
  assert.equal(res.body.user.id, '507f1f77bcf86cd799439011');
  assert.equal(res.body.role, 'staff');
});

test('admin PATCH /users/:id/role returns 500 when update fails', async (t) => {
  const handler = getFinalHandler('/users/:id/role', 'patch');
  const originalUpdate = User.findByIdAndUpdate;

  User.findByIdAndUpdate = () => {
    throw new Error('boom');
  };

  t.after(() => {
    User.findByIdAndUpdate = originalUpdate;
  });

  const res = createResponse();
  await handler(
    {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { role: 'staff' },
      user: { id: 'admin-id', role: 'admin' }
    },
    res
  );

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Failed to update user role' });
});

test('admin GET /stats returns aggregated payload with ordered statuses', async (t) => {
  const handler = getFinalHandler('/stats', 'get');
  const originalCount = Issue.countDocuments;
  const originalAggregate = Issue.aggregate;

  Issue.countDocuments = async () => 4;
  Issue.aggregate = async (pipeline) => {
    const hasCategoryProject = pipeline.some((step) => step.$project && step.$project.category);
    if (hasCategoryProject) {
      return [
        { category: 'Network', count: 2 },
        { category: 'Uncategorized', count: 1 }
      ];
    }

    return [
      { status: 'resolved', count: 1 },
      { status: 'open', count: 2 },
      { status: 'closed', count: 1 }
    ];
  };

  t.after(() => {
    Issue.countDocuments = originalCount;
    Issue.aggregate = originalAggregate;
  });

  const res = createResponse();
  await handler({ user: { id: 'staff-id', role: 'staff' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.totalIssues, 4);
  assert.deepEqual(res.body.byStatus, [
    { status: 'open', count: 2 },
    { status: 'resolved', count: 1 },
    { status: 'closed', count: 1 }
  ]);
});

test('admin GET /stats returns 500 on aggregation failure', async (t) => {
  const handler = getFinalHandler('/stats', 'get');
  const originalCount = Issue.countDocuments;

  Issue.countDocuments = async () => {
    throw new Error('boom');
  };

  t.after(() => {
    Issue.countDocuments = originalCount;
  });

  const res = createResponse();
  await handler({ user: { id: 'admin-id', role: 'admin' } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Failed to load dashboard stats' });
});
