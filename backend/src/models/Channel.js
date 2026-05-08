const mongoose = require('mongoose');

const channelPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'voice', 'file', 'poll'],
    default: 'text',
  },
  content: { type: String, maxlength: 4096, default: '' },
  media: {
    url: String,
    filename: String,
    mimetype: String,
    size: Number,
    duration: Number,
    thumbnail: String,
  },
  views: { type: Number, default: 0 },
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, maxlength: 1024 },
    createdAt: { type: Date, default: Date.now },
  }],
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 128 },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9_]+$/,
  },
  description: { type: String, maxlength: 512, default: '' },
  avatar: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true },
  inviteLink: { type: String, default: '' },
  posts: [channelPostSchema],
  subscriberCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

channelSchema.index({ name: 'text', description: 'text' });
channelSchema.index({ members: 1 });

module.exports = mongoose.model('Channel', channelSchema);
