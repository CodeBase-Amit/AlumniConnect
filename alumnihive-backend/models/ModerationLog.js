const mongoose = require('mongoose');

const ModerationLogSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['user', 'blog', 'question', 'community'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    enum: ['approve', 'reject', 'block', 'unblock', 'feature', 'unfeature', 'mark'],
    required: true
  },
  reason: String,
  metadata: {
    type: Object,
    default: {}
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

ModerationLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ModerationLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model('ModerationLog', ModerationLogSchema);
