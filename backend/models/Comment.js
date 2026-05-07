const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  issue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  body:     { type: String, required: true, trim: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

commentSchema.index({ issue_id: 1 });

module.exports = mongoose.model('Comment', commentSchema);