const Message = require('../models/Message');

// GET /api/teams/:teamId/messages?before=<id>&limit=50
const getMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before;

    const query = { team: teamId };
    if (before) query._id = { $lt: before };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name email')
      .lean();

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/teams/:teamId/messages
const sendMessage = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const message = await Message.create({
      team: teamId,
      sender: req.user._id,
      content: content.trim(),
    });

    await message.populate('sender', 'name email');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/teams/:teamId/messages/:messageId
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      team: req.params.teamId,
      sender: req.user._id,
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found or not yours' });
    }

    await message.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages, sendMessage, deleteMessage };
