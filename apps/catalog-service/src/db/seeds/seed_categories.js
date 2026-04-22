// Seed: Initial categories for GrailKits
exports.seed = async function (knex) {
  // Deleting existing entries to start fresh
  await knex("categories").del();

  // Inserting professional categories for rare football shirts
  await knex("categories").insert([
    { name: "Retro 90s" },
    { name: "Retro 00s" },
    { name: "Match Issue" },
    { name: "Limited Edition" },
    { name: "Modern Grails" },
  ]);
};
