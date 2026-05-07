const sanitizeUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const createAuthRepository = (pool) => {
  return {
    async findUserWithPasswordByEmail(email) {
      const [rows] = await pool.execute(
        `SELECT id, email, password, name, role, avatar_url, created_at, updated_at
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0];
    },

    async createUser({ email, passwordHash, name, role = 'user' }) {
      const [result] = await pool.execute(
        `INSERT INTO users (email, password, name, role)
         VALUES (?, ?, ?, ?)`,
        [email, passwordHash, name, role]
      );

      return this.findUserById(result.insertId);
    },

    async findUserById(id) {
      const [rows] = await pool.execute(
        `SELECT id, email, name, role, avatar_url, created_at, updated_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [id]
      );

      return sanitizeUser(rows[0]);
    },

    async findUserByEmail(email) {
      const user = await this.findUserWithPasswordByEmail(email);
      return sanitizeUser(user);
    }
  };
};

module.exports = {
  createAuthRepository,
  sanitizeUser
};
