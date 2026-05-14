const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { setTeamContext } = require('../middleware/teamContext');
const { getMessages, sendMessage, deleteMessage } = require('../controllers/messageController');

router.use(protect, setTeamContext);

router.route('/').get(getMessages).post(sendMessage);
router.route('/:messageId').delete(deleteMessage);

module.exports = router;
