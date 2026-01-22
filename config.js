// Import for environment variables from .env
require("dotenv").config();

// Defines JWT_SECRET as the secret in the .env file
const JWT_SECRET = process.env.JWT_SECRET;
// Throws error if secret is missing
if (!JWT_SECRET) throw new Error("JWT_SECRET missing. Check your .env file.");

// Defines the port for the API
const PORT = process.env.PORT || 3000;

// Exports the secret and the port
module.exports = { JWT_SECRET, PORT };
