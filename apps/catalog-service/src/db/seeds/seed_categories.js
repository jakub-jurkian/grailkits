// Seed: Initial categories for GrailKits
exports.seed = async function (knex) {
  // TRUNCATE resets the auto-increment sequence so IDs always start from 1
  await knex.raw("TRUNCATE TABLE categories RESTART IDENTITY CASCADE");

  // Inserting professional categories for rare football shirts
  await knex("categories").insert([
    { name: "Retro 90s" },
    { name: "Retro 00s" },
    { name: "Match Issue" },
    { name: "Limited Edition" },
    { name: "Modern Grails" },
  ]);
};
