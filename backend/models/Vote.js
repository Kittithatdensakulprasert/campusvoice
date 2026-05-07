const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  issue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

voteSchema.index({ user_id: 1, issue_id: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);