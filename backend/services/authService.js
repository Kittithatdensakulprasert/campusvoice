const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createTuApiService, TuApiError } = require('./tuApiService');

const DEFAULT_LOGIN_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX_LOGIN_ATTEMPTS = 5;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateRegistrationInput = ({ name, email, password }) => {
  const trimmedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');

  if (!trimmedName) {
    throw new AuthError('Name is required', 400);
  }

  if (trimmedName.length > 100) {
    throw new AuthError('Name must be 100 characters or fewer', 400);
  }

  if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
    throw new AuthError('A valid email is required', 400);
  }

  if (normalizedPassword.length < 8) {
    throw new AuthError('Password must be at least 8 characters long', 400);
  }

  return {
    name: trimmedName,
    email: normalizedEmail,
    password: normalizedPassword
  };
};

const validateLoginInput = ({ email, password, authType = 'local' }) => {
  if (authType === 'tu') {
    const normalizedUsername = String(email || '').trim();
    const normalizedPassword = String(password || '');

    if (!normalizedUsername) {
      throw new AuthError('Student ID is required', 400);
    }

    if (!normalizedPassword) {
      throw new AuthError('Password is required', 400);
    }

    return {
      username: normalizedUsername,
      password: normalizedPassword
    };
  }

  // Original email/password validation
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
    throw new AuthError('A valid email is required', 400);
  }

  if (!normalizedPassword) {
    throw new AuthError('Password is required', 400);
  }

  return {
    email: normalizedEmail,
    password: normalizedPassword
  };
};

const createRateLimiter = ({
  windowMs = DEFAULT_LOGIN_WINDOW_MS,
  maxAttempts = DEFAULT_MAX_LOGIN_ATTEMPTS,
  now = Date.now
} = {}) => {
  // NOTE: This is an in-memory rate limiter that resets on server restart
  // For production, consider using Redis or a database-backed rate limiter
  // to maintain rate limits across deployments and server restarts
  const attempts = new Map();

  const consume = (key) => {
    const timestamp = now();
    const current = attempts.get(key);

    if (!current || current.resetAt <= timestamp) {
      attempts.set(key, { count: 1, resetAt: timestamp + windowMs });
      return;
    }

    if (current.count >= maxAttempts) {
      throw new AuthError('Too many login attempts. Please try again later.', 429);
    }

    current.count += 1;
  };

  const reset = (key) => {
    attempts.delete(key);
  };

  return {
    consume,
    reset
  };
};

const createAuthService = ({
  authRepository,
  bcryptLib = bcrypt,
  jwtLib = jwt,
  jwtSecret = process.env.JWT_SECRET,
  jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d',
  saltRounds = 10,
  rateLimiter = createRateLimiter(),
  tuApiService = createTuApiService()
}) => {
  if (!authRepository) {
    throw new Error('authRepository is required');
  }

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  const signToken = (user) => {
    return jwtLib.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
  };

  return {
    async register(input) {
      const { name, email, password } = validateRegistrationInput(input);
      const existingUser = await authRepository.findUserWithPasswordByEmail(email);

      if (existingUser) {
        throw new AuthError('Email is already registered', 409);
      }

      const passwordHash = await bcryptLib.hash(password, saltRounds);
      const user = await authRepository.createUser({
        name,
        email,
        passwordHash
      });

      return {
        user,
        token: signToken(user)
      };
    },

    async login(input, options = {}) {
      const authType = input.authType || 'local';
      
      if (authType === 'tu') {
        return await this.loginWithTuApi(input, options);
      }
      
      // Original local login
      const { email, password } = validateLoginInput(input);
      const rateLimitKey = options.rateLimitKey || email;
      rateLimiter.consume(rateLimitKey);

      const userRecord = await authRepository.findUserWithPasswordByEmail(email);
      if (!userRecord) {
        throw new AuthError('Invalid email or password', 401);
      }

      const isPasswordValid = await bcryptLib.compare(password, userRecord.password);
      if (!isPasswordValid) {
        throw new AuthError('Invalid email or password', 401);
      }

      rateLimiter.reset(rateLimitKey);

      const user = await authRepository.findUserById(userRecord.id);
      return {
        user,
        token: signToken(user)
      };
    },

    async loginWithTuApi(input, options = {}) {
      const { username, password } = validateLoginInput({ ...input, authType: 'tu' });
      const rateLimitKey = options.rateLimitKey || username;
      rateLimiter.consume(rateLimitKey);

      try {
        // Authenticate with TU API v1
        const authResult = await tuApiService.authenticate(username, password);
        
        if (authResult.type !== 'student') {
          throw new AuthError('Only student accounts are allowed', 403);
        }

        // Get student info from TU API v2
        const studentInfo = await tuApiService.getStudentInfo(username);
        
        if (!studentInfo.data || studentInfo.data.type !== 'student') {
          throw new AuthError('Only student accounts are allowed', 403);
        }

        const data = studentInfo.data;
        
        // Check if user already exists
        let user = await authRepository.findUserByStudentId(username);
        
        if (!user) {
          // Create new user
          user = await authRepository.createTuUser({
            email: data.email,
            name: data.displayname_th,
            student_id: username,
            displayname_th: data.displayname_th,
            displayname_en: data.displayname_en,
            faculty: data.faculty,
            department: data.department,
            status_name: data.statusname,
            auth_type: 'tu'
          });
        } else {
          // Update existing user info
          user = await authRepository.updateTuUser(user.id, {
            email: data.email,
            name: data.displayname_th,
            displayname_th: data.displayname_th,
            displayname_en: data.displayname_en,
            faculty: data.faculty,
            department: data.department,
            status_name: data.statusname
          });
        }

        rateLimiter.reset(rateLimitKey);

        return {
          user,
          token: signToken(user)
        };
      } catch (error) {
        if (error instanceof TuApiError) {
          throw new AuthError(error.message, error.statusCode);
        }
        throw error;
      }
    },

    async getCurrentUser(userId) {
      if (!userId) {
        throw new AuthError('User id is required', 400);
      }

      const user = await authRepository.findUserById(userId);
      if (!user) {
        throw new AuthError('User not found', 404);
      }

      return user;
    }
  };
};

module.exports = {
  AuthError,
  createAuthService,
  createRateLimiter,
  normalizeEmail,
  validateLoginInput,
  validateRegistrationInput
};
