const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 32,
    match: /^[a-z0-9_]+$/,
  },
  firstName: { type: String, required: false, trim: true, maxlength: 64, default: '' },
  lastName: { type: String, trim: true, maxlength: 64, default: '' },
  bio: { type: String, maxlength: 256, default: '' },
  avatar: { type: String, default: '' },
  password: { type: String, select: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  refreshTokens: [{ type: String, select: false }],
  privacySettings: {
    lastSeenVisible: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    profilePhotoVisible: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    storyVisible: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
  },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    phone: this.phone,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    bio: this.bio,
    avatar: this.avatar,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    privacySettings: this.privacySettings,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
