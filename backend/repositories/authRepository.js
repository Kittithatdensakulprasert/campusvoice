const User = require('../models/User');

const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatar_url ?? null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

const createAuthRepository = () => ({
  async findUserWithPasswordByEmail(email) {
    const user = await User.findOne({ email }).lean();
    if (!user) return null;
    return { ...user, id: user._id.toString() };
  },

  async createUser({ email, passwordHash, name, role = 'user' }) {
    const user = await User.create({ email, password: passwordHash, name, role });
    return this.findUserById(user._id.toString());
  },

  async findUserById(id) {
    const user = await User.findById(id).lean();
    return sanitizeUser(user);
  },

  async findUserByEmail(email) {
    const user = await this.findUserWithPasswordByEmail(email);
    return sanitizeUser(user);
  },
});

module.exports = { createAuthRepository, sanitizeUser };