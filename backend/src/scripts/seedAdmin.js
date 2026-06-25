const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const env = require('../config/env');
const User = require('../models/User');

(async () => {
  try {
    const email = String(env.admin.email || '').trim().toLowerCase();
    const password = String(env.admin.password || '');
    const name = String(env.admin.name || 'Admin').trim() || 'Admin';

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error('ADMIN_EMAIL valid email hona chahiye');
    }
    if (password.length < 8) {
      throw new Error('ADMIN_PASSWORD kam se kam 8 characters hona chahiye');
    }

    await connectDB();

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          email,
          passwordHash,
          role: 'admin',
          blocked: false,
        },
        $addToSet: { providers: 'password' },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`Admin ready: ${user.email} (${user._id})`);
  } catch (err) {
    console.error('Seed admin failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
