// Imports for bcrypt and database
const bcrypt = require("bcrypt");
const db = require("../db");

// Convert DB row to the format the code is expecting
const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
  };
};

// Function for finding user by username
const findByUsername = (username) => {
  const row = db.prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?").get(username);
  return mapUser(row);
};

// Function for creating user
const createUser = ({ username, passwordHash, role = "user" }) => {
  const stmt = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
  const info = stmt.run(username, passwordHash, role);

  return {
    id: Number(info.lastInsertRowid),
    username,
    passwordHash,
    role,
  };
};

// Function for seeding admin, which gets done before startup
const seedAdmin = async () => {
  const admin = findByUsername("admin");
  if (!admin) {
    const passwordHash = await bcrypt.hash("password123", 10);
    createUser({ username: "admin", passwordHash, role: "admin" });
  }
};

module.exports = { findByUsername, createUser, seedAdmin };
