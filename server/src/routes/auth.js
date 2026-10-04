const express = require('express');
const { authRequired } = require('../middleware/auth');
const auth = require('../controllers/authController');

const router = express.Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.post('/demo', auth.demo);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.get('/me', authRequired, auth.me);

module.exports = router;
