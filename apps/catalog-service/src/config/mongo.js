const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:rootpassword@mongo:27017/grailkits?authSource=admin';
const DB_NAME = 'grailkits';

let client = null;
let db = null;

async function connectMongo() {
  if (client) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();

  db = client.db(DB_NAME);
  console.log('[MongoDB] Connection established successfully');

  // Ensure indexes exist on the product_details collection
  const col = db.collection('product_details');
  await col.createIndex({ productId: 1 }, { unique: true });
  await col.createIndex({ longDescription: 'text' });
  console.log('[MongoDB] product_details indexes ensured');

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('[MongoDB] Not connected — call connectMongo() first');
  }
  return db;
}

// Graceful shutdown: close the connection when the process exits
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('[MongoDB] Connection closed on SIGINT');
  }
  process.exit(0);
});

module.exports = { connectMongo, getDb };
