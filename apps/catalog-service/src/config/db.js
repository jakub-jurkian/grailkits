// Database configuration - Native pg driver
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "root",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "grailkits_db",
  password: process.env.DB_PASSWORD || "rootpassword",
  port: process.env.DB_PORT || 5432,
});

// Logging connection status
pool.on("connect", () => {
  console.log("[Postgres] Connection established successfully");
});

pool.on("error", (err) => {
  console.error("[Postgres] Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
