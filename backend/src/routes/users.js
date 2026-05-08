const express = require('express');
const router = express.Router();
const {
  updateProfile, searchUsers, getUserProfile,
  getContacts, addContact, removeContact, blockUser, updatePrivacy,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);

router.get('/search', searchUsers);
router.get('/contacts', getContacts);
router.post('/contacts', addContact);
router.delete('/contacts/:userId', removeContact);
router.post('/block', blockUser);
router.put('/privacy', updatePrivacy);
router.put('/profile', upload.single('avatar'), updateProfile);
router.get('/:identifier', getUserProfile);

module.exports = router;
