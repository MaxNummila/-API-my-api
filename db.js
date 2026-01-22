// Import for better-sqlite3
const Database = require("better-sqlite3");

// Creates/opens db.sqlite in the project folder
const dbFile = process.env.DB_FILE || "db.sqlite";
const db = new Database(dbFile);

// Write-ahead logging instead of a rollback
db.pragma("journal_mode = WAL");

// Creates a database table for the users if it does not exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Creates a database table for the products in case it does not exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add columns if missing, handles JWT token refreshing
const ensureColumn = (table, column, definition) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

ensureColumn("users", "refresh_token_hash", "TEXT");
ensureColumn("users", "refresh_token_expires_at", "TEXT");

module.exports = db;
