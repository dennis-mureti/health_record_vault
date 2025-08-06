const bcrypt = require("bcryptjs");
const { openDb } = require("../config/database");

const User = {
  // Get database connection
  getDb: async function () {
    return await openDb();
  },

  // Get all users
  getAll: async function () {
    const db = await this.getDb();
    return await db.all("SELECT * FROM users");
  },

  // Get user by ID
  getById: async function (id) {
    const db = await this.getDb();
    return await db.get("SELECT * FROM users WHERE user_id = ?", [id]);
  },

  // Get user by email
  getByEmail: async function (email) {
    const db = await this.getDb();
    return await db.get("SELECT * FROM users WHERE email = ?", [email]);
  },

  // Create new user
  create: async function (userData) {
    const { firstName, lastName, email, password, role, phoneNumber } =
      userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await this.getDb();
    await db.run(
      "INSERT INTO users (username, password_hash, user_type, email, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [email, hashedPassword, role, email, firstName, lastName, phoneNumber]
    );
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    return user;
  },

  // Update user
  update: async function (id, userData) {
    const { firstName, lastName, email, password, role, phoneNumber } =
      userData;
    const db = await this.getDb();

    let sql = "UPDATE users SET";
    const values = [];
    if (firstName) {
      sql += " first_name = ?,";
      values.push(firstName);
    }
    if (lastName) {
      sql += " last_name = ?,";
      values.push(lastName);
    }
    if (email) {
      sql += " email = ?,";
      values.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += " password_hash = ?,";
      values.push(hashedPassword);
    }
    if (role) {
      sql += " user_type = ?,";
      values.push(role);
    }
    if (phoneNumber) {
      sql += " phone = ?,";
      values.push(phoneNumber);
    }

    // Remove trailing comma
    sql = sql.replace(/,$/, "");
    sql += " WHERE user_id = ?";
    values.push(id);

    await db.run(sql, values);
    return await this.getById(id);
  },

  // Delete user
  delete: async function (id) {
    const db = await this.getDb();
    await db.run("DELETE FROM users WHERE user_id = ?", [id]);
    return true;
  },

  // Compare password
  comparePassword: async function (email, password) {
    const db = await this.getDb();
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return false;
    return await bcrypt.compare(password, user.password_hash);
  },
};

module.exports = User;
