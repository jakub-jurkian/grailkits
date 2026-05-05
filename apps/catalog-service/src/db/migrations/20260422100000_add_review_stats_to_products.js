/**
 * Adds denormalised review statistics columns to products.
 * Written by review-service when a review is approved (hybrid PG+Mongo write-back).
 */
exports.up = function (knex) {
  return knex.schema.alterTable('products', (table) => {
    table.integer('review_count').notNullable().defaultTo(0);
    table.decimal('avg_rating', 3, 2).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('products', (table) => {
    table.dropColumn('review_count');
    table.dropColumn('avg_rating');
  });
};
