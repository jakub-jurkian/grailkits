// Migration: Create products and variants tables with Foreign Keys
exports.up = async function(knex) {
  // Create Products Table
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign Key linking to categories table
    table.integer('category_id').unsigned().notNullable()
         .references('id').inTable('categories').onDelete('CASCADE');
         
    table.string('name').notNullable();
    table.string('brand').notNullable();
    table.text('description');
    table.timestamps(true, true);
  });

  // Create Variants Table
  await knex.schema.createTable('variants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign Key linking to products table
    table.uuid('product_id').notNullable()
         .references('id').inTable('products').onDelete('CASCADE');
         
    table.string('size').notNullable(); // e.g., 'S', 'M', 'L'
    table.integer('price').notNullable(); // Price in grosze (e.g. 29900 = 299.00 PLN)
    table.integer('stock').notNullable().defaultTo(0);
    table.string('sku').unique().notNullable(); // Stock Keeping Unit
    
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  // Drop in reverse order to avoid Foreign Key constraint errors
  await knex.schema.dropTableIfExists('variants');
  await knex.schema.dropTableIfExists('products');
};