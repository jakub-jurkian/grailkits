// Seed: Initial categories for GrailKits
exports.seed = async function (knex) {
  // Idempotent: skip if already seeded (preserves all dependent data across restarts)
  const existing = await knex('categories').count('id as count').first();
  if (parseInt(existing.count) > 0) {
    console.log('[Catalog Service] Categories already seeded — skipping');
    return;
  }

  // Inserting professional categories for rare football shirts
  await knex("categories").insert([
    { name: "Retro 90s" },
    { name: "Retro 00s" },
    { name: "Match Issue" },
    { name: "Limited Edition" },
    { name: "Modern Grails" },
  ]);
};
