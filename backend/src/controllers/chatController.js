const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ 'participants.user': req.user._id })
      .populate('participants.user', 'firstName lastName username avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'firstName lastName username' },
      })
      .sort({ updatedAt: -1 });

    const result = chats.map((chat) => {
      const myParticipant = chat.participants.find((p) => p.user._id.toString() === req.user._id.toString());
      const unreadCount = 0; // computed separately if needed
      const isArchived = chat.isArchived.some((id) => id.toString() === req.user._id.toString());
      return { ...chat.toObject(), myRole: myParticipant?.role, isArchived, unreadCount };
    });

    res.json({ success: true, chats: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createPrivateChat = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const existing = await Chat.findOne({
      type: 'private',
      'participants.user': { $all: [req.user._id, userId] },
    })
      .populate('participants.user', 'firstName lastName username avatar isOnline lastSeen')
      .populate('lastMessage');

    if (existing) return res.json({ success: true, chat: existing });

    const chat = await Chat.create({
      type: 'private',
      participants: [
        { user: req.user._id, role: 'admin' },
        { user: userId, role: 'admin' },
      ],
    });

    await chat.populate('participants.user', 'firstName lastName username avatar isOnline lastSeen');
    res.status(201).json({ success: true, chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createGroupChat = async (req, res) => {
  try {
    const { name, participants } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Group name required' });

    const memberIds = [...new Set([...(participants || []), req.user._id.toString()])];
    const chat = await Chat.create({
      type: 'group',
      name,
      inviteLink: uuidv4(),
      participants: memberIds.map((id) => ({
        user: id,
        role: id === req.user._id.toString() ? 'admin' : 'member',
      })),
    });

    await chat.populate('participants.user', 'firstName lastName username avatar isOnline lastSeen');

    const systemMessage = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      type: 'system',
      content: `${req.user.firstName} created the group`,
    });

    await Chat.findByIdAndUpdate(chat._id, { lastMessage: systemMessage._id });

    res.status(201).json({ success: true, chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      'participants.user': req.user._id,
    })
      .populate('participants.user', 'firstName lastName username avatar isOnline lastSeen')
      .populate('pinnedMessages');

    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.archiveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { archive } = req.body;

    if (archive) {
      await Chat.findByIdAndUpdate(chatId, { $addToSet: { isArchived: req.user._id } });
    } else {
      await Chat.findByIdAndUpdate(chatId, { $pull: { isArchived: req.user._id } });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findOne({ _id: chatId, 'participants.user': req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const myRole = chat.participants.find((p) => p.user.toString() === req.user._id.toString())?.role;
    if (myRole !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can add members' });

    await Chat.findByIdAndUpdate(chatId, {
      $addToSet: { participants: { user: userId, role: 'member' } },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.leaveChat = async (req, res) => {
  try {
    await Chat.findByIdAndUpdate(req.params.chatId, {
      $pull: { participants: { user: req.user._id } },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateGroupInfo = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, description } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (req.file) updates.avatar = req.file.path;

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, 'participants': { $elemMatch: { user: req.user._id, role: 'admin' } } },
      updates,
      { new: true }
    ).populate('participants.user', 'firstName lastName username avatar isOnline lastSeen');

    if (!chat) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
