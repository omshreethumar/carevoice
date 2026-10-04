const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/aiController');

const router = express.Router();
router.use(authRequired);
router.post('/chat', ctrl.chat);
router.get('/conversations', ctrl.conversations);

module.exports = router;
