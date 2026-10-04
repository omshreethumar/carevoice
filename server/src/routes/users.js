const express = require('express');
const { authRequired } = require('../middleware/auth');
const auth = require('../controllers/authController');
const emergency = require('../controllers/emergencyController');

const router = express.Router();
router.use(authRequired);
router.get('/me', auth.me);
router.put('/me', auth.updateMe);
router.get('/me/emergency-fund', emergency.get);
router.put('/me/emergency-fund', emergency.upsert);

module.exports = router;
