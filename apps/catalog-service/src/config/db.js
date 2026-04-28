// Database configuration - Native pg driver
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://root:rootpassword@postgres:5432/grailkits_db",
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
