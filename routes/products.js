// Imports for express and authentication
const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
// Imports for the functions from the data/products file
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../data/products");

// Creates the express router for holding the endpoints
const router = express.Router();

// Small helper that makes sure that the program produces consistent JSON errors
const jsonError = (res, status, message, details) => {
  const body = { error: message };
  if (details) body.details = details;
  return res.status(status).json(body);
};

// Function for parsing an id, which if not a number or an invalid number (negative) returns the appropriate error
const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    jsonError(res, 400, "Invalid id (must be a positive integer)");
    return null;
  }
  return id;
};

// Function for validating the body of a product
const validateProductBody = (req, res) => {
  const { name, price } = req.body;

  // Check for the name to be a string and to not be empty
  if (typeof name !== "string" || name.trim().length === 0) {
    jsonError(res, 400, "Invalid name (must be a non-empty string)");
    return null;
  }

  // Check for making sure the price is not negative
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    jsonError(res, 400, "Invalid price (must be a number >= 0)");
    return null;
  }

  return { name: name.trim(), price: priceNum };
};

// READ all, which lists all products
router.get("/products", (req, res) => {
  res.json(listProducts());
});

// READ one, which uses the parseid to get an id from the user and then returns that product
router.get("/products/:id", (req, res) => {
  const id = parseId(req, res);
  if (!id) return;

  const product = getProductById(id);
  if (!product) return jsonError(res, 404, "Product not found");

  res.json(product);
});

// CREATE, which creates a new product. Only for admin role.
router.post("/products", verifyToken, requireRole("admin"), (req, res) => {
  const body = validateProductBody(req, res);
  if (!body) return;

  const created = createProduct(body);
  res.status(201).json(created);
});

// UPDATE, which updates a products information. Only for admin role
router.put("/products/:id", verifyToken, requireRole("admin"), (req, res) => {
  const id = parseId(req, res);
  if (!id) return;

  const body = validateProductBody(req, res);
  if (!body) return;

  const updated = updateProduct(id, body);
  if (!updated) return jsonError(res, 404, "Product not found");

  res.json(updated);
});

// DELETE, which deletes a product. Only for admin role
router.delete("/products/:id", verifyToken, requireRole("admin"), (req, res) => {
  const id = parseId(req, res);
  if (!id) return;

  const ok = deleteProduct(id);
  if (!ok) return jsonError(res, 404, "Product not found");

  res.status(204).send();
});

module.exports = router;
