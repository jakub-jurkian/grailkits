const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('[Review Service] MongoDB connected successfully');
  } catch (error) {
    console.error('[Review Service] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;