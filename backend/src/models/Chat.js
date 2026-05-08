const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true,
  },
  name: { type: String, trim: true, maxlength: 128 },
  avatar: { type: String, default: '' },
  description: { type: String, maxlength: 512, default: '' },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    mutedUntil: { type: Date, default: null },
    lastRead: { type: Date, default: Date.now },
  }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  isArchived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  inviteLink: { type: String, default: '' },
}, { timestamps: true });

chatSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Chat', chatSchema);
