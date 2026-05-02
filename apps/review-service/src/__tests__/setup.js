const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Start in-memory MongoDB before all tests in the suite
async function setupMongo() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

// Drop all collections between tests so each test starts clean
async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// Disconnect and stop the in-memory server after all tests
async function teardownMongo() {
  await mongoose.disconnect();
  await mongod.stop();
}

module.exports = { setupMongo, clearCollections, teardownMongo };
