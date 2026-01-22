process.env.DB_FILE = "db_test.sqlite";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeAll(async () => {
  if (app.ready) await app.ready;
});

beforeEach(() => {
  db.prepare("DELETE FROM products").run();
  db.prepare("DELETE FROM users WHERE username != 'admin'").run();
  db.prepare("UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE username = 'admin'").run();
});


const loginAdmin = async () => {
  const res = await request(app)
    .post("/api/v1/login")
    .send({ username: "admin", password: "password123" })
    .expect(200);

  return res.body.accessToken;
};

test("non-admin cannot create product", async () => {
  await request(app)
    .post("/api/v1/register")
    .send({ username: "max", password: "hello123" })
    .expect(201);

  const loginRes = await request(app)
    .post("/api/v1/login")
    .send({ username: "max", password: "hello123" })
    .expect(200);

  const token = loginRes.body.accessToken;

  await request(app)
    .post("/api/v1/products")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Keyboard", price: 199.99 })
    .expect(403);
});

test("admin can create/read/update/delete product", async () => {
  const token = await loginAdmin();

  // Create
  const created = await request(app)
    .post("/api/v1/products")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Keyboard", price: 199.99 })
    .expect(201);

  const id = created.body.id;
  expect(id).toBeTruthy();

  // Read one
  const one = await request(app)
    .get(`/api/v1/products/${id}`)
    .expect(200);

  expect(one.body.name).toBe("Keyboard");

  // Update
  const updated = await request(app)
    .put(`/api/v1/products/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Keyboard Pro", price: 249.99 })
    .expect(200);

  expect(updated.body.price).toBe(249.99);

  // Delete
  await request(app)
    .delete(`/api/v1/products/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);
});
