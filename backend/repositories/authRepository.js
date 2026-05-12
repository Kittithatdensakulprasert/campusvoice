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
    studentId: user.student_id ?? null,
    displayNameTh: user.displayname_th ?? null,
    displayNameEn: user.displayname_en ?? null,
    faculty: user.faculty ?? null,
    department: user.department ?? null,
    statusName: user.status_name ?? null,
    levelName: user.level_name ?? null,
    authType: user.auth_type ?? 'local',
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

  async findUserByStudentId(studentId) {
    const user = await User.findOne({ student_id: studentId }).lean();
    return sanitizeUser(user);
  },

  async createTuUser({ email, name, student_id, displayname_th, displayname_en, faculty, department, status_name, level_name, auth_type = 'tu', role = 'user' }) {
    const user = await User.create({
      email,
      name,
      student_id,
      displayname_th,
      displayname_en,
      faculty,
      department,
      status_name,
      level_name,
      auth_type,
      role
    });
    return this.findUserById(user._id.toString());
  },

  async updateTuUser(userId, { email, name, displayname_th, displayname_en, faculty, department, status_name, level_name }) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        email,
        name,
        displayname_th,
        displayname_en,
        faculty,
        department,
        status_name,
        level_name
      },
      { new: true }
    ).lean();
    return sanitizeUser(user);
  },
});

module.exports = { createAuthRepository, sanitizeUser };