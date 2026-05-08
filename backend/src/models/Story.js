const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['image', 'video', 'text'], required: true },
  media: { type: String, default: '' },
  content: { type: String, maxlength: 512, default: '' },
  backgroundColor: { type: String, default: '#1a1a2e' },
  textColor: { type: String, default: '#ffffff' },
  duration: { type: Number, default: 5 },
  viewers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now },
  }],
  reactions: [{
    emoji: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 },
  },
  privacy: { type: String, enum: ['everyone', 'contacts', 'selected'], default: 'everyone' },
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema);
