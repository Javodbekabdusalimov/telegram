const Message = require('../models/Message');
const Chat = require('../models/Chat');
const xss = require('xss');

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    const chat = await Chat.findOne({ _id: chatId, 'participants.user': req.user._id });
    if (!chat) return res.status(403).json({ success: false, message: 'Access denied' });

    const query = {
      chat: chatId,
      isDeleted: false,
      deletedFor: { $ne: req.user._id },
    };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName username avatar')
      .populate('replyTo')
      .populate('forwardedFrom', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', replyTo, forwardedFrom } = req.body;

    const chat = await Chat.findOne({ _id: chatId, 'participants.user': req.user._id });
    if (!chat) return res.status(403).json({ success: false, message: 'Access denied' });

    const messageData = {
      chat: chatId,
      sender: req.user._id,
      type,
      content: content ? xss(content) : '',
      replyTo: replyTo || null,
      forwardedFrom: forwardedFrom || null,
    };

    if (req.file) {
      messageData.media = {
        url: req.file.path,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'firstName lastName username avatar');
    if (replyTo) await message.populate('replyTo');

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findOne({ _id: messageId, sender: req.user._id, isDeleted: false });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    message.content = xss(content);
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forAll } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    if (forAll && message.sender.toString() === req.user._id.toString()) {
      message.isDeleted = true;
      message.content = '';
      message.media = undefined;
    } else {
      message.deletedFor.push(req.user._id);
    }

    await message.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        chat: chatId,
        'readBy.user': { $ne: req.user._id },
      },
      { $addToSet: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    await Chat.findOneAndUpdate(
      { _id: chatId, 'participants.user': req.user._id },
      { $set: { 'participants.$.lastRead': new Date() } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const existingReaction = message.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      const idx = existingReaction.users.indexOf(req.user._id);
      if (idx > -1) {
        existingReaction.users.splice(idx, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(req.user._id);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();
    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;

    const messages = await Message.find({
      chat: chatId,
      type: 'text',
      content: { $regex: q, $options: 'i' },
      isDeleted: false,
    })
      .populate('sender', 'firstName lastName username avatar')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
