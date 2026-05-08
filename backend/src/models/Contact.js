const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nickname: { type: String, trim: true, maxlength: 64, default: '' },
  isFavorite: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

contactSchema.index({ owner: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Contact', contactSchema);
