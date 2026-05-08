const User = require('../models/User');
const Contact = require('../models/Contact');
const path = require('path');

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, username } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (bio !== undefined) updates.bio = bio;

    if (username) {
      const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ success: false, message: 'Username already taken' });
      updates.username = username.toLowerCase();
    }

    if (req.file) {
      updates.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query too short' });
    }

    const raw = q.trim();
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      _id: { $ne: req.user._id },
      isVerified: true,
      $or: [
        { username: { $regex: escaped, $options: 'i' } },
        { firstName: { $regex: escaped, $options: 'i' } },
        { lastName: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped } },
      ],
    }).select('firstName lastName username avatar isOnline lastSeen').limit(20);

    res.json({ success: true, users });
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    const user = await User.findOne({
      $or: [{ username: identifier }, { _id: identifier }],
    }).select('firstName lastName username avatar bio isOnline lastSeen privacySettings createdAt');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ owner: req.user._id, isBlocked: false })
      .populate('user', 'firstName lastName username avatar isOnline lastSeen')
      .sort({ isFavorite: -1, createdAt: -1 });

    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addContact = async (req, res) => {
  try {
    const { userId, nickname } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const contact = await Contact.findOneAndUpdate(
      { owner: req.user._id, user: userId },
      { nickname: nickname || '', isBlocked: false },
      { upsert: true, new: true }
    ).populate('user', 'firstName lastName username avatar isOnline lastSeen');

    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.removeContact = async (req, res) => {
  try {
    await Contact.findOneAndDelete({ owner: req.user._id, user: req.params.userId });
    res.json({ success: true, message: 'Contact removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    await Contact.findOneAndUpdate(
      { owner: req.user._id, user: userId },
      { isBlocked: true },
      { upsert: true }
    );
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } });
    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { lastSeenVisible, profilePhotoVisible, storyVisible } = req.body;
    const updates = {};
    if (lastSeenVisible) updates['privacySettings.lastSeenVisible'] = lastSeenVisible;
    if (profilePhotoVisible) updates['privacySettings.profilePhotoVisible'] = profilePhotoVisible;
    if (storyVisible) updates['privacySettings.storyVisible'] = storyVisible;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, privacySettings: user.privacySettings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
