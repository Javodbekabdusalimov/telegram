const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const onlineUsers = new Map();

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('firstName lastName username avatar isOnline');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    io.emit('user:online', { userId, isOnline: true });

    const userChats = await Chat.find({ 'participants.user': userId }).select('_id');
    userChats.forEach((chat) => {
      socket.join(`chat:${chat._id}`);
    });

    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, type, replyTo, tempId } = data;

        const chat = await Chat.findOne({ _id: chatId, 'participants.user': userId });
        if (!chat) return;

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          type: type || 'text',
          content: content || '',
          replyTo: replyTo || null,
        });

        await message.populate('sender', 'firstName lastName username avatar');
        if (replyTo) await message.populate('replyTo');

        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

        io.to(`chat:${chatId}`).emit('message:new', { message, tempId });
      } catch (err) {
        socket.emit('message:error', { error: err.message });
      }
    });

    socket.on('message:typing', (data) => {
      socket.to(`chat:${data.chatId}`).emit('message:typing', {
        chatId: data.chatId,
        userId,
        firstName: socket.user.firstName,
        isTyping: data.isTyping,
      });
    });

    socket.on('message:read', async (data) => {
      try {
        const { chatId, messageIds } = data;
        await Message.updateMany(
          { _id: { $in: messageIds }, chat: chatId, 'readBy.user': { $ne: userId } },
          { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
        );
        io.to(`chat:${chatId}`).emit('message:read', { chatId, messageIds, userId });
      } catch (err) {}
    });

    socket.on('message:react', async (data) => {
      try {
        const { messageId, emoji, chatId } = data;
        const message = await Message.findById(messageId);
        if (!message) return;

        const existing = message.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          const idx = existing.users.findIndex((u) => u.toString() === userId);
          if (idx > -1) existing.users.splice(idx, 1);
          else existing.users.push(userId);
          if (existing.users.length === 0) {
            message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
          }
        } else {
          message.reactions.push({ emoji, users: [userId] });
        }

        await message.save();
        io.to(`chat:${chatId}`).emit('message:reacted', { messageId, reactions: message.reactions });
      } catch (err) {}
    });

    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('call:invite', (data) => {
      const targetSocketId = onlineUsers.get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:incoming', {
          from: socket.user,
          chatId: data.chatId,
          callType: data.callType,
          offer: data.offer,
        });
      }
    });

    socket.on('call:answer', (data) => {
      const targetSocketId = onlineUsers.get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:answered', { answer: data.answer });
      }
    });

    socket.on('call:ice-candidate', (data) => {
      const targetSocketId = onlineUsers.get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ice-candidate', { candidate: data.candidate });
      }
    });

    socket.on('call:end', (data) => {
      const targetSocketId = onlineUsers.get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ended');
      }
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user:online', { userId, isOnline: false, lastSeen: new Date() });
    });
  });
};
