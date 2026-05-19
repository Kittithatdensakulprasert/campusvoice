const test = require('node:test');
const assert = require('node:assert/strict');

const issuesRouter = require('../routes/issues');
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
  return issuesRouter.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  ).route;
}

test('issues GET /:id returns 400 when id is invalid', async () => {
  const route = getRoute('/:id', 'get');
  const handler = route.stack[0].handle;

  const req = { params: { id: 'bad-id' }, headers: {} };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Invalid issue id' });
});

test('issues PATCH /:id/status rejects invalid status', async () => {
  const route = getRoute('/:id/status', 'patch');
  const handler = route.stack[2].handle;

  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    body: { status: 'unknown' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Invalid status' });
});

test('issues PATCH /:id/status updates issue successfully', async (t) => {
  const route = getRoute('/:id/status', 'patch');
  const handler = route.stack[2].handle;
  const originalFindByIdAndUpdate = Issue.findByIdAndUpdate;

  Issue.findByIdAndUpdate = async () => ({ _id: '507f1f77bcf86cd799439011' });

  t.after(() => {
    Issue.findByIdAndUpdate = originalFindByIdAndUpdate;
  });

  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    body: { status: 'resolved' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    message: 'Status updated',
    issueId: '507f1f77bcf86cd799439011',
    status: 'resolved'
  });
});

test('issues POST / rejects empty title', async () => {
  const route = getRoute('/', 'post');
  const handler = route.stack[2].handle;

  const req = {
    body: {
      title: '   ',
      description: 'valid description'
    },
    user: { id: 'u1' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'กรุณากรอกหัวข้อปัญหา' });
});

test('issues DELETE /:id blocks non-owner non-admin users', async (t) => {
  const route = getRoute('/:id', 'delete');
  const handler = route.stack[1].handle;
  const originalFindById = Issue.findById;

  Issue.findById = async () => ({
    user_id: { toString: () => 'owner-id' }
  });

  t.after(() => {
    Issue.findById = originalFindById;
  });

  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    user: { id: 'other-user', role: 'user' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'ไม่มีสิทธิ์ลบ issue นี้' });
});

test('issues DELETE /:id allows owner to delete', async (t) => {
  const route = getRoute('/:id', 'delete');
  const handler = route.stack[1].handle;
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

  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    user: { id: 'owner-id', role: 'user' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(deleted, true);
  assert.deepEqual(res.body, {
    message: 'Issue deleted',
    issueId: '507f1f77bcf86cd799439011'
  });
});
