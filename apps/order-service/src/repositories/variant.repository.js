const { QueryTypes } = require("sequelize");
const { sequelize } = require("../config/db");

class VariantRepository {
  async getVariantById(variantId, transaction) {
    const rows = await sequelize.query(
      "SELECT id, product_id, price, stock, sku FROM variants WHERE id = :variantId",
      {
        replacements: { variantId },
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    return rows[0] || null;
  }

  async getVariantForUpdate(variantId, transaction) {
    const rows = await sequelize.query(
      "SELECT id, product_id, price, stock, sku FROM variants WHERE id = :variantId FOR UPDATE",
      {
        replacements: { variantId },
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    return rows[0] || null;
  }

  async decrementStock(variantId, quantity, transaction) {
    await sequelize.query(
      "UPDATE variants SET stock = stock - :quantity WHERE id = :variantId",
      {
        replacements: { variantId, quantity },
        type: QueryTypes.UPDATE,
        transaction,
      }
    );
  }

  async incrementStock(variantId, quantity, transaction) {
    await sequelize.query(
      "UPDATE variants SET stock = stock + :quantity WHERE id = :variantId",
      {
        replacements: { variantId, quantity },
        type: QueryTypes.UPDATE,
        transaction,
      }
    );
  }
}

module.exports = VariantRepository;
