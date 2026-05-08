const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'voice', 'file', 'location', 'sticker', 'gif', 'system'],
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
    width: Number,
    height: Number,
  },
  location: {
    latitude: Number,
    longitude: Number,
    name: String,
  },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  deliveredTo: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date, default: Date.now },
  }],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
