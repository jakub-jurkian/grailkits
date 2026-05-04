// Set DATABASE_URL before any Sequelize model is imported
process.env.DATABASE_URL = 'postgres://root:rootpassword@localhost:5432/grailkits_test';
process.env.NODE_ENV = 'test';

// Now safe to import — sequelize singleton will use the test DB
const { sequelize } = require('../config/db');
require('../models'); // registers all four models against the test sequelize instance

async function setupDB() {
  // Drop & recreate tables. Also purge any stale ENUM types from previous runs
  // so that force:true doesn't trip over "type already exists" in Postgres.
  await sequelize.query(`
    DO $$ DECLARE
      t TEXT;
    BEGIN
      FOR t IN
        SELECT typname FROM pg_type
        WHERE typtype = 'e'
          AND typname IN (
            'enum_carts_status',
            'enum_orders_status',
            'enum_cart_lines_status'
          )
      LOOP
        EXECUTE 'DROP TYPE IF EXISTS "' || t || '" CASCADE';
      END LOOP;
    END $$;
  `).catch(() => {}); // non-fatal if DB doesn't exist yet

  await sequelize.sync({ force: true });
}

async function teardownDB() {
  await sequelize.drop({ cascade: true });
  await sequelize.close();
}

module.exports = { sequelize, setupDB, teardownDB };
