const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { setTeamContext } = require('../middleware/teamContext');
const { aiChat } = require('../controllers/aiController');

router.use(protect, setTeamContext);
router.post('/chat', aiChat);

module.exports = router;
