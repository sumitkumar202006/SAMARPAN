const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function elevateAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    // 1. Elevate mauryaman2005@gmail.com
    const userToElevate = await User.findOne({ email: 'mauryaman2005@gmail.com' });
    if (userToElevate) {
      userToElevate.role = 'admin';
      await userToElevate.save();
      console.log('✅ mauryaman2005@gmail.com elevated to ADMIN');
    } else {
      console.warn('⚠️ mauryaman2005@gmail.com not found. Please sign up first.');
    }

    // 2. Create/Update Dedicated Admin
    const adminEmail = 'admin@samarpan';
    const adminPass = 'purna.samarpan@admin';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPass, salt);

    const dedicatedAdmin = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'Nexus Overlord',
        email: adminEmail,
        passwordHash: hash,
        role: 'admin',
        provider: 'local'
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Dedicated Admin account set up: ${adminEmail}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during elevation:', err);
    process.exit(1);
  }
}

elevateAdmin();
