// Imports for express, bcrypt, JWT, the JWT_SECRET and the database data file
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { findByUsername, createUser } = require("../data/users");
// Imports for crypto and the database
const crypto = require("crypto");
const db = require("../db");

// Standard for jsonErrors
const jsonError = (res, status, message) => res.status(status).json({ error: message });

// Function for creating a JWT access token using the JWT_SECRET
const signAccessToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "15m" } 
  );

// Creates a refresh token that is used to refresh the access tokens
const makeRefreshToken = () => crypto.randomBytes(48).toString("hex");
// Hashing of token with sha256
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
// Function for adding an amount of days
const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};
// Function to set the refresh token
const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // Set to false for learning, true for HTTPS in real project
    path: "/api/v1", // cookie only sent to the API routes
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (in ms)
  });
};

// Creates the router which holds related endpoints
const router = express.Router();

const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use("/api/v1", authLimiter);

// Defines a POST which is triggered when a client sends a POST request to /register
router.post("/register", async (req, res) => {
  // req.body is readable since it was parsed in app.js
  // Takes the username and password out of the body
  const { username, password } = req.body;

  // Check for missing credentials
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  // Check for already existing user
  const existing = findByUsername(username);
  if (existing) return res.status(409).json({ error: "username already exists" });

  // Hashing of the password done by bcrypt
  const passwordHash = await bcrypt.hash(password, 10);

  // Creates and stores a user with the hash of their password with the default role of user
  const user = createUser({
    username,
    passwordHash,
    role: "user",
  });

  // Response definition
  res.status(201).json({
    message: "User registered",
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// POST definition which handles login by reading the JSON body
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // Check for making sure both username and password are not missing
  if (!username || !password) {
    return jsonError(res, 400, "username and password are required");
  }
  // Check for returning error if findByUsername cant find the given user
  const user = findByUsername(username);
  if (!user) return jsonError(res, 401, "Invalid credentials");
  // Check for returning error if the wrong password is given
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return jsonError(res, 401, "Invalid credentials");

  // Create short-lived access token
  const accessToken = signAccessToken(user);

  // Creates refresh token and stores hash in DB
  const refreshToken = makeRefreshToken();
  const refreshHash = hashToken(refreshToken);
  const refreshExp = addDaysISO(7);

  // Updates database with given info
  db.prepare(
    "UPDATE users SET refresh_token_hash = ?, refresh_token_expires_at = ? WHERE id = ?"
  ).run(refreshHash, refreshExp, user.id);

  // Send refresh token as HttpOnly cookie
  setRefreshCookie(res, refreshToken);

  // Return access token in JSON
  res.json({
    message: "Login successful",
    accessToken,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

router.post("/token/refresh", (req, res) => {
  // Check for missing refresh token
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return jsonError(res, 401, "Missing refresh token");
  
  const refreshHash = hashToken(refreshToken);

  // Find user by refresh token hash
  const row = db.prepare(
    "SELECT id, username, role, refresh_token_expires_at FROM users WHERE refresh_token_hash = ?"
  ).get(refreshHash);

  if (!row) return jsonError(res, 401, "Invalid refresh token");

  // Expiry check
  if (!row.refresh_token_expires_at || new Date(row.refresh_token_expires_at) <= new Date()) {
    return jsonError(res, 401, "Refresh token expired");
  }

  // Rotate refresh token (safer)
  const newRefreshToken = makeRefreshToken();
  const newRefreshHash = hashToken(newRefreshToken);
  const newExp = addDaysISO(7);

  db.prepare(
    "UPDATE users SET refresh_token_hash = ?, refresh_token_expires_at = ? WHERE id = ?"
  ).run(newRefreshHash, newExp, row.id);

  setRefreshCookie(res, newRefreshToken);

  // New access token
  const accessToken = signAccessToken(row);

  res.json({ accessToken });
});

router.post("/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const refreshHash = hashToken(refreshToken);
    db.prepare(
      "UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE refresh_token_hash = ?"
    ).run(refreshHash);
  }

  res.clearCookie("refreshToken", { path: "/api/v1" });
  res.json({ message: "Logged out" });
});


module.exports = router;