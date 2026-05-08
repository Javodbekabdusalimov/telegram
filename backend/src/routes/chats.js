const express = require('express');
const router = express.Router();
const {
  getChats, createPrivateChat, createGroupChat, getChatById,
  archiveChat, addParticipant, leaveChat, updateGroupInfo,
} = require('../controllers/chatController');
const {
  getMessages, sendMessage, editMessage, deleteMessage,
  markAsRead, addReaction, searchMessages,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);

router.get('/', getChats);
router.post('/private', createPrivateChat);
router.post('/group', createGroupChat);
router.get('/:chatId', getChatById);
router.put('/:chatId/archive', archiveChat);
router.post('/:chatId/participants', addParticipant);
router.delete('/:chatId/leave', leaveChat);
router.put('/:chatId/group', upload.single('avatar'), updateGroupInfo);

router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', upload.single('media'), sendMessage);
router.put('/:chatId/messages/:messageId', editMessage);
router.delete('/:chatId/messages/:messageId', deleteMessage);
router.post('/:chatId/messages/read', markAsRead);
router.post('/:chatId/messages/:messageId/react', addReaction);
router.get('/:chatId/messages/search', searchMessages);

module.exports = router;
