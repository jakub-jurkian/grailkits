// Singleton Knex instance. Shared by app.js (for migrations + seeds at boot)
// and by product.repository.js (for dynamic where queries). Before this file
// existed, both files instantiated their own Knex client, each with its own
// connection pool - wasteful and surprising. One source of truth now.
const knex = require('knex')(
  require('../../knexfile')[process.env.NODE_ENV || 'development']
);

module.exports = knex;
