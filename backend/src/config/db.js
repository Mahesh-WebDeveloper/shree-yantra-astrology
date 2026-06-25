// MongoDB se connect (local MongoDB Compass / mongod).
const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  mongoose.connection.on('connected', () => console.log('✅ MongoDB connected:', env.mongoUri));
  mongoose.connection.on('error', (e) => console.error('❌ MongoDB error:', e.message));
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 20 });
}

module.exports = connectDB;
