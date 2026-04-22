// Migration: Create categories table
exports.up = function(knex) {
  return knex.schema.createTable('categories', (table) => {
    table.increments('id').primary(); // Auto-incrementing primary key
    table.string('name').notNullable().unique(); // Category name (e.g., 'Retro')
    table.timestamps(true, true); // Adds created_at and updated_at
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('categories');
};