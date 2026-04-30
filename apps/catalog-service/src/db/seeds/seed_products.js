// Seed: Products and variants with fixed UUIDs so order/review services can reference them
exports.seed = async function (knex) {
  // Clear in FK order
  await knex('variants').del();
  await knex('products').del();

  const [retro90s, retro00s, matchIssue, limited, modern] = await Promise.all([
    knex('categories').where({ name: 'Retro 90s' }).first(),
    knex('categories').where({ name: 'Retro 00s' }).first(),
    knex('categories').where({ name: 'Match Issue' }).first(),
    knex('categories').where({ name: 'Limited Edition' }).first(),
    knex('categories').where({ name: 'Modern Grails' }).first(),
  ]);

  await knex('products').insert([
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      category_id: retro90s.id,
      name: 'Real Madrid 1998 Home',
      brand: 'Kelme',
      description: 'Legendary shirt from the 1998 Champions League final.',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      category_id: retro00s.id,
      name: 'Barcelona 2006 Away',
      brand: 'Nike',
      description: 'Iconic dark blue away shirt from the Ronaldinho era.',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      category_id: matchIssue.id,
      name: 'Arsenal 1989 Home',
      brand: 'Adidas',
      description: 'Match-issue shirt from the title-winning 1988-89 season.',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      category_id: limited.id,
      name: 'France 1998 World Cup Home',
      brand: 'Adidas',
      description: 'The shirt worn when Les Bleus lifted the World Cup on home soil.',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000005',
      category_id: modern.id,
      name: 'Manchester City 2023 Third',
      brand: 'Puma',
      description: 'Treble-winning season third kit — already a modern grail.',
    },
  ]);

  await knex('variants').insert([
    // Real Madrid 1998 Home
    { id: 'b0000000-0000-0000-0000-000000000001', product_id: 'a0000000-0000-0000-0000-000000000001', size: 'M', price: 89900, stock: 2, sku: 'RM98-HOME-M' },
    { id: 'b0000000-0000-0000-0000-000000000002', product_id: 'a0000000-0000-0000-0000-000000000001', size: 'L', price: 95000, stock: 1, sku: 'RM98-HOME-L' },
    // Barcelona 2006 Away
    { id: 'b0000000-0000-0000-0000-000000000003', product_id: 'a0000000-0000-0000-0000-000000000002', size: 'S', price: 75000, stock: 3, sku: 'BAR06-AWAY-S' },
    { id: 'b0000000-0000-0000-0000-000000000004', product_id: 'a0000000-0000-0000-0000-000000000002', size: 'M', price: 75000, stock: 1, sku: 'BAR06-AWAY-M' },
    // Arsenal 1989 Home
    { id: 'b0000000-0000-0000-0000-000000000005', product_id: 'a0000000-0000-0000-0000-000000000003', size: 'L', price: 150000, stock: 1, sku: 'ARS89-HOME-L' },
    { id: 'b0000000-0000-0000-0000-000000000006', product_id: 'a0000000-0000-0000-0000-000000000003', size: 'XL', price: 155000, stock: 1, sku: 'ARS89-HOME-XL' },
    // France 1998 Home
    { id: 'b0000000-0000-0000-0000-000000000007', product_id: 'a0000000-0000-0000-0000-000000000004', size: 'M', price: 120000, stock: 2, sku: 'FRA98-HOME-M' },
    { id: 'b0000000-0000-0000-0000-000000000008', product_id: 'a0000000-0000-0000-0000-000000000004', size: 'L', price: 125000, stock: 1, sku: 'FRA98-HOME-L' },
    // Man City 2023 Third
    { id: 'b0000000-0000-0000-0000-000000000009', product_id: 'a0000000-0000-0000-0000-000000000005', size: 'S', price: 45000, stock: 5, sku: 'MCFC23-THIRD-S' },
    { id: 'b0000000-0000-0000-0000-000000000010', product_id: 'a0000000-0000-0000-0000-000000000005', size: 'M', price: 45000, stock: 4, sku: 'MCFC23-THIRD-M' },
  ]);
};
