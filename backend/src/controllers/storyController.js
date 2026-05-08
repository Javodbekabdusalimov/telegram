const Story = require('../models/Story');
const Contact = require('../models/Contact');

exports.createStory = async (req, res) => {
  try {
    const { type, content, backgroundColor, textColor, duration, privacy } = req.body;

    const storyData = {
      user: req.user._id,
      type: type || 'image',
      content: content || '',
      backgroundColor: backgroundColor || '#1a1a2e',
      textColor: textColor || '#ffffff',
      duration: duration || 5,
      privacy: privacy || 'everyone',
    };

    if (req.file) storyData.media = req.file.path;

    const story = await Story.create(storyData);
    await story.populate('user', 'firstName lastName username avatar');

    res.status(201).json({ success: true, story });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getStories = async (req, res) => {
  try {
    const contacts = await Contact.find({ owner: req.user._id, isBlocked: false }).select('user');
    const contactIds = contacts.map((c) => c.user);
    const userIds = [...contactIds, req.user._id];

    const stories = await Story.find({
      user: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('user', 'firstName lastName username avatar')
      .sort({ createdAt: -1 });

    const grouped = {};
    stories.forEach((story) => {
      const uid = story.user._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: story.user,
          stories: [],
          hasUnread: false,
        };
      }
      const isViewed = story.viewers.some((v) => v.user.toString() === req.user._id.toString());
      grouped[uid].stories.push({ ...story.toObject(), isViewed });
      if (!isViewed) grouped[uid].hasUnread = true;
    });

    res.json({ success: true, stories: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    await Story.findByIdAndUpdate(storyId, {
      $addToSet: { viewers: { user: req.user._id, viewedAt: new Date() } },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    await Story.findOneAndDelete({ _id: req.params.storyId, user: req.user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyStories = async (req, res) => {
  try {
    const stories = await Story.find({
      user: req.user._id,
      expiresAt: { $gt: new Date() },
    })
      .populate('viewers.user', 'firstName lastName username avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, stories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
