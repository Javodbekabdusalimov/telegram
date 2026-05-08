/**
 * Reset DB: delete all users/chats/messages/etc, then create one demo account.
 * Run: node scripts/reset_and_seed.js
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const DEMO_PHONE = '+998901234567';
const DEMO_FIRST = 'Demo';
const DEMO_LAST  = 'User';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;

  // Drop all collections
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
    console.log(`🗑  Dropped: ${col.name}`);
  }

  // Create demo user via User model
  const User = require('../src/models/User');
  const user = await User.create({
    phone: DEMO_PHONE,
    firstName: DEMO_FIRST,
    lastName: DEMO_LAST,
    isVerified: true,
    isOnline: false,
  });

  console.log(`\n✅ Demo account created:`);
  console.log(`   Phone:    ${DEMO_PHONE}`);
  console.log(`   Name:     ${DEMO_FIRST} ${DEMO_LAST}`);
  console.log(`   ID:       ${user._id}`);
  console.log(`\n   Login with this phone → OTP will appear in the yellow box on screen.\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
