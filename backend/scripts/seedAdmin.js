#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcrypt');
const connectDB = require('../db');
const User = require('../models/User');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@campusvoice.ac.th';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Admin';

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    await User.updateOne({ email: ADMIN_EMAIL }, { role: 'admin' });
    console.log(`Updated existing user "${ADMIN_EMAIL}" to role admin`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: passwordHash,
      role:     'admin',
    });
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
