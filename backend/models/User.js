const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  name:       { type: String, required: true, trim: true, maxlength: 100 },
  role:       { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
  avatar_url: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', userSchema);