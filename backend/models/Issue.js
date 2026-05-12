const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, maxlength: 100, trim: true },
  description: { type: String, required: true, maxlength: 500, trim: true },
  category:    { type: String, default: null },
  location:    { type: String, default: null, maxlength: 200, trim: true },
  image_url:   { type: String, default: null },
  status:      { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ user_id: 1 });

module.exports = mongoose.model('Issue', issueSchema);