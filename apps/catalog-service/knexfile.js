require("dotenv").config();

const sharedConfig = {
  client: "pg",
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "rootpassword",
    database: process.env.DB_NAME || "grailkits_db",
  },
  migrations: {
    directory: "./src/db/migrations",
  },
  seeds: {
    directory: "./src/db/seeds",
  },
};

module.exports = {
  development: sharedConfig,
  production: sharedConfig,
};
