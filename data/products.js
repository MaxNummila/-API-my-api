// Import for database
const db = require("../db");

// Function for listing all products
const listProducts = () => {
  return db.prepare("SELECT id, name, price, created_at FROM products ORDER BY id").all();
};

// Function for listing a selected product
const getProductById = (id) => {
  return db.prepare("SELECT id, name, price, created_at FROM products WHERE id = ?").get(id);
};

// Function for creating a new product, returns the product
const createProduct = ({ name, price }) => {
  const info = db
    .prepare("INSERT INTO products (name, price) VALUES (?, ?)")
    .run(name, price);

  return getProductById(Number(info.lastInsertRowid));
};

// Function for updating a product by the id
const updateProduct = (id, { name, price }) => {
  const info = db
    .prepare("UPDATE products SET name = ?, price = ? WHERE id = ?")
    .run(name, price, id);

  // info.changes tells how many rows were updated, if it is zero then function returns null
  if (info.changes === 0) return null;

  return getProductById(id);
};

// Function for deleting product by id
const deleteProduct = (id) => {
  const info = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return info.changes > 0;
};

module.exports = { listProducts, getProductById, createProduct, updateProduct, deleteProduct };
