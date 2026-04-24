const { Sequelize } = require('sequelize');
// Singleton
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('[Order Service] PostgreSQL connected via Sequelize');
  } catch (error) {
    console.error('[Order Service] Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };