// Function that gets a request on the way in and can stip it or let it continue

// Makes sure that the library for jsonwebtokens exists
const jwt = require("jsonwebtoken");
// Imports the JWT_SECRET that is used to verify signatures
const { JWT_SECRET } = require("../config");

// Middleware function
const verifyToken = (req, res, next) => {
  // Looks at the incoming request header "Authorization"
  const authHeader = req.get("Authorization");
  // Expects format "Bearer <token>" and splits it accordingly
  const token = authHeader && authHeader.split(" ")[1];

  // Check for missing token
  if (!token) return res.status(401).json({ error: "Missing token" });

  // If the token signature matches JWT_SECRET it continues, other gives error
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid or expired token" });

    // If the verification goes through, the trusted payload gets put on req.user
    // This means that: req.user.id, req.user.username and rqe.user.role can be trusted after this
    req.user = decoded;
    next();
  });
};

// Another middleware function that assumes that verifyToken already ran
const requireRole = (role) => (req, res, next) => {
  // Checks if the user has the required role for doing something, either throws an error or continues
  if (req.user.role !== role) return res.status(403).json({ error: "Forbidden" });
  next();
};

module.exports = { verifyToken, requireRole };
