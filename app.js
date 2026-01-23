// Imports for express, cookieparser and the database for users
const express = require("express");
const { seedAdmin } = require("./data/users");
const cookieParser = require("cookie-parser");

// Imports for helmet and CORS
const helmet = require("helmet");
const cors = require("cors");

// Frontend at 5173 is now allowed to call 3000 and include cookies
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

// Calls the express function to make an app object
const app = express();

app.use(helmet());

// Imports for the different routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const adminRoutes = require("./routes/admin");


// Adds middleware that checks incoming requests and parses the JSON in it and sets req.body to a JS object
app.use(express.json());
// Adds middleware that uses the cookieparser to handle the token refreshing
app.use(cookieParser());
// Defines a route for get at the root path. Basically a useless home path to check if the server is up
app.get("/", (req, res) => res.send("Welcome to my API"));

// Mount routes under /api/v1
app.use("/api/v1", productRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", adminRoutes);

// Seed admin before server starts
app.ready = seedAdmin();

module.exports = app;
