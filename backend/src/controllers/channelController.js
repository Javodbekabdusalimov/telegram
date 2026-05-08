const Channel = require('../models/Channel');
const xss = require('xss');
const { v4: uuidv4 } = require('uuid');

exports.createChannel = async (req, res) => {
  try {
    const { name, description, username, isPublic } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Channel name required' });

    if (username) {
      const exists = await Channel.findOne({ username: username.toLowerCase() });
      if (exists) return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const channel = await Channel.create({
      name,
      description: description || '',
      username: username ? username.toLowerCase() : undefined,
      owner: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
      isPublic: isPublic !== false,
      inviteLink: uuidv4(),
      subscriberCount: 1,
      avatar: req.file ? req.file.path : '',
    });

    await channel.populate('owner', 'firstName lastName username avatar');
    res.status(201).json({ success: true, channel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ members: req.user._id })
      .populate('owner', 'firstName lastName username avatar')
      .select('-posts')
      .sort({ subscriberCount: -1 });

    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getChannel = async (req, res) => {
  try {
    const { identifier } = req.params;
    const channel = await Channel.findOne({
      $or: [{ _id: identifier }, { username: identifier }],
    }).populate('owner', 'firstName lastName username avatar')
      .populate('admins', 'firstName lastName username avatar');

    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found' });

    const isMember = channel.members.some((m) => m.toString() === req.user._id.toString());
    const channelObj = channel.toObject();
    if (!isMember && !channel.isPublic) {
      return res.status(403).json({ success: false, message: 'Private channel' });
    }

    res.json({ success: true, channel: channelObj, isMember });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.joinChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found' });

    if (!channel.members.includes(req.user._id)) {
      channel.members.push(req.user._id);
      channel.subscriberCount += 1;
      await channel.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.leaveChannel = async (req, res) => {
  try {
    await Channel.findByIdAndUpdate(req.params.channelId, {
      $pull: { members: req.user._id },
      $inc: { subscriberCount: -1 },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, type = 'text' } = req.body;

    const channel = await Channel.findOne({
      _id: channelId,
      $or: [{ owner: req.user._id }, { admins: req.user._id }],
    });
    if (!channel) return res.status(403).json({ success: false, message: 'Not authorized' });

    const post = {
      author: req.user._id,
      type,
      content: content ? xss(content) : '',
    };

    if (req.file) {
      post.media = {
        url: req.file.path,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
    }

    channel.posts.push(post);
    await channel.save();

    const newPost = channel.posts[channel.posts.length - 1];
    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const channel = await Channel.findById(channelId)
      .populate('posts.author', 'firstName lastName username avatar');
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found' });

    const start = (parseInt(page) - 1) * parseInt(limit);
    const posts = channel.posts.sort((a, b) => b.createdAt - a.createdAt).slice(start, start + parseInt(limit));

    res.json({ success: true, posts, total: channel.posts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.searchChannels = async (req, res) => {
  try {
    const { q } = req.query;
    const channels = await Channel.find({
      isPublic: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    }).select('name username avatar description subscriberCount verified').limit(20);

    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, description } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (req.file) updates.avatar = req.file.path;

    const channel = await Channel.findOneAndUpdate(
      { _id: channelId, $or: [{ owner: req.user._id }, { admins: req.user._id }] },
      updates,
      { new: true }
    );

    if (!channel) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, channel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { channelId, postId } = req.params;
    const channel = await Channel.findOne({
      _id: channelId,
      $or: [{ owner: req.user._id }, { admins: req.user._id }],
    });
    if (!channel) return res.status(403).json({ success: false, message: 'Not authorized' });

    channel.posts.id(postId).remove();
    await channel.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
