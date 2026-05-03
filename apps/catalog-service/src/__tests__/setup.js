// Must set DATABASE_URL before any module that reads it is imported
process.env.DATABASE_URL = 'postgres://root:rootpassword@localhost:5432/grailkits_test';
process.env.NODE_ENV = 'test';

const { Pool } = require('pg');
const knex = require('knex');

const TEST_DB_URL = process.env.DATABASE_URL;

// Shared pg pool for tests
const pool = new Pool({ connectionString: TEST_DB_URL });

// Knex pointed at test DB — used for migrations and seeds
const knexInstance = knex({
  client: 'pg',
  connection: TEST_DB_URL,
  migrations: { directory: require('path').join(__dirname, '../../src/db/migrations') },
  seeds: { directory: require('path').join(__dirname, '../../src/db/seeds') },
});

async function setupDB() {
  await knexInstance.migrate.latest();
  await knexInstance.seed.run();
}

async function teardownDB() {
  await knexInstance.migrate.rollback({}, true); // roll back all batches
  await pool.end();
  await knexInstance.destroy();
}

module.exports = { pool, knexInstance, setupDB, teardownDB };
