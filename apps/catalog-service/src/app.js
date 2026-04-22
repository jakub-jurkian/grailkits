const express = require("express");
const pool = require("./config/db");
const CategoryRepository = require("./repositories/category.repository");

const app = express();
app.use(express.json());

// Manual Dependency Injection (Java-style)
const categoryRepo = new CategoryRepository(pool);

app.get("/api/v1/categories", async (req, res) => {
  try {
    const categories = await categoryRepo.findAll();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Catalog Service running on port ${PORT}`);
});
