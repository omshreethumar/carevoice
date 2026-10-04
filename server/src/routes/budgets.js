const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/budgetController');

const router = express.Router();
router.use(authRequired);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
