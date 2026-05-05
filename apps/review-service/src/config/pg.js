const { Pool } = require('pg');

// Connects to the shared PostgreSQL instance (same DB as catalog-service).
// Used only for writing denormalised review stats back to the products table.
// Connection is established lazily on first use.
let pool = null;

function getCatalogPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set — cannot write review stats to PostgreSQL');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

async function closeCatalogPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getCatalogPool, closeCatalogPool };
