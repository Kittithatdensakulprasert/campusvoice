const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { AuthError, createAuthService, createRateLimiter } = require('../services/authService');
const verifyToken = require('../middleware/verifyToken');
const { buildAuthRouter } = require('../routes/auth');

const createResponse = () => {
  return {
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
  };
};

test('auth service registers a new user and returns a signed token', async () => {
  const savedUsers = [];
  const authRepository = {
    async findUserWithPasswordByEmail() {
      return null;
    },
    async createUser({ email, passwordHash, name }) {
      const user = { id: 1, email, name, role: 'user', passwordHash };
      savedUsers.push(user);
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
    async findUserById(id) {
      const user = savedUsers.find((entry) => entry.id === id);
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    }
  };

  const authService = createAuthService({
    authRepository,
    bcryptLib: {
      async hash(password) {
        return `hashed:${password}`;
      },
      async compare() {
        return false;
      }
    },
    jwtLib: {
      sign(payload, secret, options) {
        return JSON.stringify({ payload, secret, options });
      }
    },
    jwtSecret: 'register-secret'
  });

  const result = await authService.register({
    name: 'Alice',
    email: 'Alice@Example.com',
    password: 'strongpass'
  });

  assert.equal(savedUsers[0].passwordHash, 'hashed:strongpass');
  assert.equal(result.user.email, 'alice@example.com');
  assert.match(result.token, /register-secret/);
});

test('auth service rejects duplicate registration', async () => {
  const authService = createAuthService({
    authRepository: {
      async findUserWithPasswordByEmail() {
        return { id: 99 };
      }
    },
    bcryptLib: {
      async hash() {
        throw new Error('should not hash');
      },
      async compare() {
        return false;
      }
    },
    jwtLib: { sign() { return 'token'; } },
    jwtSecret: 'duplicate-secret'
  });

  await assert.rejects(
    authService.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'strongpass'
    }),
    (error) => error instanceof AuthError && error.statusCode === 409
  );
});

test('auth service logs in valid users and resets rate limiter', async () => {
  const limiter = createRateLimiter({
    windowMs: 1000,
    maxAttempts: 1,
    now: () => 0
  });

  const authService = createAuthService({
    authRepository: {
      async findUserWithPasswordByEmail(email) {
        return {
          id: 7,
          email,
          password: 'stored-hash',
          name: 'Alice',
          role: 'admin'
        };
      },
      async findUserById(id) {
        return { id, email: 'alice@example.com', name: 'Alice', role: 'admin' };
      }
    },
    bcryptLib: {
      async hash() {
        return '';
      },
      async compare(password, hash) {
        return password === 'strongpass' && hash === 'stored-hash';
      }
    },
    jwtLib: { sign() { return 'signed-token'; } },
    jwtSecret: 'login-secret',
    rateLimiter: limiter
  });

  const result = await authService.login(
    { email: 'alice@example.com', password: 'strongpass' },
    { rateLimitKey: 'ip:alice@example.com' }
  );

  assert.equal(result.token, 'signed-token');
  assert.equal(result.user.role, 'admin');
});

test('auth service rate limits repeated failed login attempts', async () => {
  let currentTime = 0;
  const authService = createAuthService({
    authRepository: {
      async findUserWithPasswordByEmail(email) {
        return {
          id: 7,
          email,
          password: 'stored-hash',
          name: 'Alice',
          role: 'user'
        };
      },
      async findUserById() {
        return null;
      }
    },
    bcryptLib: {
      async hash() {
        return '';
      },
      async compare() {
        return false;
      }
    },
    jwtLib: { sign() { return 'signed-token'; } },
    jwtSecret: 'limit-secret',
    rateLimiter: createRateLimiter({
      windowMs: 1000,
      maxAttempts: 2,
      now: () => currentTime
    })
  });

  await assert.rejects(
    authService.login(
      { email: 'alice@example.com', password: 'bad-password' },
      { rateLimitKey: 'ip:alice@example.com' }
    ),
    (error) => error instanceof AuthError && error.statusCode === 401
  );

  await assert.rejects(
    authService.login(
      { email: 'alice@example.com', password: 'bad-password' },
      { rateLimitKey: 'ip:alice@example.com' }
    ),
    (error) => error instanceof AuthError && error.statusCode === 401
  );

  await assert.rejects(
    authService.login(
      { email: 'alice@example.com', password: 'bad-password' },
      { rateLimitKey: 'ip:alice@example.com' }
    ),
    (error) => error instanceof AuthError && error.statusCode === 429
  );

  currentTime = 2000;

  await assert.rejects(
    authService.login(
      { email: 'alice@example.com', password: 'bad-password' },
      { rateLimitKey: 'ip:alice@example.com' }
    ),
    (error) => error instanceof AuthError && error.statusCode === 401
  );
});

test('verifyToken rejects missing and invalid tokens', async () => {
  process.env.JWT_SECRET = 'middleware-secret';

  const missingReq = { headers: {} };
  const missingRes = createResponse();
  let nextCalled = false;
  verifyToken(missingReq, missingRes, () => {
    nextCalled = true;
  });
  assert.equal(missingRes.statusCode, 401);
  assert.equal(nextCalled, false);

  const invalidReq = { headers: { authorization: 'Bearer invalid' } };
  const invalidRes = createResponse();
  verifyToken(invalidReq, invalidRes, () => {
    nextCalled = true;
  });
  assert.equal(invalidRes.statusCode, 401);
  assert.deepEqual(invalidRes.body, { error: 'Invalid token' });
});

test('verifyToken accepts valid token and attaches user payload', async () => {
  process.env.JWT_SECRET = 'middleware-secret';
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: 44, email: 'alice@example.com', role: 'staff' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const req = {
    headers: {
      authorization: `Bearer ${token}`
    }
  };
  const res = createResponse();
  let nextCalled = false;

  verifyToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, {
    id: 44,
    email: 'alice@example.com',
    role: 'staff'
  });
});

test('auth router returns current user from /me', async () => {
  const router = buildAuthRouter({
    authService: {
      async register() {
        throw new Error('not used');
      },
      async login() {
        throw new Error('not used');
      },
      async getCurrentUser(userId) {
        return { id: userId, email: 'alice@example.com', name: 'Alice', role: 'user' };
      }
    },
    authMiddleware(req, res, next) {
      req.user = { id: 12 };
      next();
    }
  });

  const meLayer = router.stack.find((layer) => layer.route && layer.route.path === '/me');
  assert.ok(meLayer, 'expected /me route to exist');
  assert.equal(meLayer.route.stack.length, 2);

  const req = { user: undefined };
  const res = createResponse();
  let middlewareCalled = false;

  await new Promise((resolve, reject) => {
    meLayer.route.stack[0].handle(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      middlewareCalled = true;
      resolve();
    });
  });

  await meLayer.route.stack[1].handle(req, res);

  assert.equal(middlewareCalled, true);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.user, {
    id: 12,
    email: 'alice@example.com',
    name: 'Alice',
    role: 'user'
  });
});
