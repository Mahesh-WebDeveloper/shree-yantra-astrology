require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = ['books', 'gitachapters', 'ramayansargas', 'ramcharitmanas', 'rigvedas', 'vedatexts', 'mediaitems', 'users', 'analyticsevents', 'faqitems', 'subscriptionplans', 'notifications'];
  for (const name of collections) {
    try {
      const n = await db.collection(name).countDocuments();
      console.log(`${name}: ${n}`);
    } catch {
      console.log(`${name}: (missing)`);
    }
  }
  await mongoose.disconnect();
})();
