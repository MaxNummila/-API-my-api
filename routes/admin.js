// Loads express library
const express = require("express");
// Loads the auth middleware, which makes sure that the token and role are checked
const { verifyToken, requireRole } = require("../middleware/auth");

// Defines a router, which works like an app that holds related endpoints
const router = express.Router();

// Defines method GET to the path /admin/stats and then checks the role and token. If allowed it then does the final handles which returns the JSON response
router.get("/admin/stats", verifyToken, requireRole("admin"), (req, res) => {
  res.json({ ok: true, message: "Top secret admin stats" });
});

module.exports = router;