process.env.DB_FILE = "db_test.sqlite"; // must be set before requiring app

const request = require("supertest");
const fs = require("fs");
const path = require("path");

process.env.DB_FILE = "db_test.sqlite";

const testDbPath = path.join(__dirname, "..", process.env.DB_FILE);
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);


const app = require("../app");
const db = require("../db");

beforeAll(async () => {
  // wait for seedAdmin if you use app.ready = seedAdmin()
  if (app.ready) await app.ready;
});

beforeEach(() => {
  // clean DB between tests (keep admin)
  db.prepare("DELETE FROM users WHERE username != 'admin'").run();
  db.prepare("UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE username = 'admin'").run();
  db.prepare("DELETE FROM products").run();
});

test("register -> login returns accessToken", async () => {
  await request(app)
    .post("/api/v1/register")
    .send({ username: "max", password: "hello123" })
    .expect(201);

  const res = await request(app)
    .post("/api/v1/login")
    .send({ username: "max", password: "hello123" })
    .expect(200);

  expect(res.body.accessToken).toBeTruthy();
  expect(res.body.user.username).toBe("max");
});

test("refresh gives a new accessToken (cookie-based)", async () => {
  // supertest agent keeps cookies between requests (like a browser)
  const agent = request.agent(app);

  // login (sets refresh cookie)
  const loginRes = await agent
    .post("/api/v1/login")
    .send({ username: "admin", password: "password123" })
    .expect(200);

  expect(loginRes.body.accessToken).toBeTruthy();

  // refresh (uses cookie automatically)
  const refreshRes = await agent
    .post("/api/v1/token/refresh")
    .expect(200);

  expect(refreshRes.body.accessToken).toBeTruthy();
});

test("logout invalidates refresh token", async () => {
  const agent = request.agent(app);

  await agent
    .post("/api/v1/login")
    .send({ username: "admin", password: "password123" })
    .expect(200);

  await agent
    .post("/api/v1/logout")
    .expect(200);

  // refresh should now fail because cookie was cleared + DB token revoked
  await agent
    .post("/api/v1/token/refresh")
    .expect(401);
});
