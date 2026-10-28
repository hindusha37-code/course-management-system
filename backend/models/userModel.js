
const db = require("../config/db");

const User = {
  // Login மற்றும் username lookup-க்கு.
  // Password hash-ஐ response-ல் அனுப்பக்கூடாது.
  async findByUsername(username) {
    const [rows] = await db.execute(
      `SELECT id, username, full_name, role, password
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    return rows[0] || null;
  },

  // Public profile fields மட்டும்.
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT id, username, full_name, role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  },

  // Authenticated user's password hash-ஐ
  // password verification-க்கு மட்டும் பெற.
  async findByIdWithPassword(id) {
    const [rows] = await db.execute(
      `SELECT id, username, full_name, role, password
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  },

  async updateFullName(id, fullName) {
    await db.execute(
      "UPDATE users SET full_name = ? WHERE id = ?",
      [fullName, id]
    );

    return this.findById(id);
  },

  async updatePassword(id, passwordHash) {
    await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [passwordHash, id]
    );
  },

  async countByRole(role) {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS count FROM users WHERE role = ?",
      [role]
    );

    return rows[0].count;
  },
};

module.exports = User;
