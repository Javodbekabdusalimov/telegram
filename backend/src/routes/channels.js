const express = require('express');
const router = express.Router();
const {
  createChannel, getMyChannels, getChannel, joinChannel, leaveChannel,
  createPost, getPosts, searchChannels, updateChannel, deletePost,
} = require('../controllers/channelController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);

router.get('/search', searchChannels);
router.get('/my', getMyChannels);
router.post('/', upload.single('avatar'), createChannel);
router.get('/:identifier', getChannel);
router.post('/:channelId/join', joinChannel);
router.post('/:channelId/leave', leaveChannel);
router.put('/:channelId', upload.single('avatar'), updateChannel);
router.get('/:channelId/posts', getPosts);
router.post('/:channelId/posts', upload.single('media'), createPost);
router.delete('/:channelId/posts/:postId', deletePost);

module.exports = router;
