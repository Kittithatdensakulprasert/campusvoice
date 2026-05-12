const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: false }, // ไม่จำเป็นสำหรับ TU API login
  name:       { type: String, required: true, trim: true, maxlength: 100 },
  role:       { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
  avatar_url: { type: String, default: null },
  // TU API fields
  student_id: { type: String, sparse: true, unique: true }, // รหัสนักศึกษา
  displayname_th: { type: String, trim: true }, // ชื่อ-นามสกุลภาษาไทย
  displayname_en: { type: String, trim: true }, // ชื่อ-นามสกุลภาษาอังกฤษ
  faculty: { type: String, trim: true }, // คณะ
  department: { type: String, trim: true }, // สาขาวิชา
  status_name: { type: String, trim: true }, // สถานะนักศึกษา
  level_name: { type: String, trim: true }, // ระดับการศึกษา
  auth_type: { type: String, enum: ['local', 'tu'], default: 'local' }, // ประเภทการ auth
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', userSchema);