const express = require('express');
const router = express.Router();
const { createStory, getStories, viewStory, deleteStory, getMyStories } = require('../controllers/storyController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);

router.get('/', getStories);
router.get('/my', getMyStories);
router.post('/', upload.single('media'), createStory);
router.post('/:storyId/view', viewStory);
router.delete('/:storyId', deleteStory);

module.exports = router;
