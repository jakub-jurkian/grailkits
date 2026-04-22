// Seed: Initial product and variants
exports.seed = async function(knex) {
  // Clear existing data (variants must be deleted before products due to Foreign Keys)
  await knex('variants').del();
  await knex('products').del();
  
  // Find the 'Retro 90s' category ID
  const retroCategory = await knex('categories').where({ name: 'Retro 90s' }).first();
  
  if (!retroCategory) {
    console.log('Category not found. Please run category seeds first.');
    return;
  }

  // Insert the legendary shirt and get its inserted UUID
  const [product] = await knex('products').insert({
    category_id: retroCategory.id,
    name: 'Real Madrid 1998 Home',
    brand: 'Kelme',
    description: 'Legendary shirt from the 1998 Champions League final.'
  }).returning('id'); // returning('id') is crucial to get the UUID back

  // 3. Insert the physical variants (sizes in stock)
  await knex('variants').insert([
    { 
      product_id: product.id, 
      size: 'M', 
      price: 89900, // 899.00 PLN
      stock: 2, 
      sku: 'RM98-HOME-M' 
    },
    { 
      product_id: product.id, 
      size: 'L', 
      price: 95000, // 950.00 PLN (L size is rarer)
      stock: 1, 
      sku: 'RM98-HOME-L' 
    }
  ]);
};