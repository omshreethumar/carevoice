const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

const router = express.Router();
router.use(authRequired);
router.get('/', ctrl.analytics);
router.get('/dashboard', ctrl.dashboard);
router.get('/insights', ctrl.insights);
router.get('/predictions', ctrl.predictions);
router.get('/health', ctrl.health);

module.exports = router;
