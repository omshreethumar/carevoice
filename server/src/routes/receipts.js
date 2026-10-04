const express = require('express');
const { authRequired } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/receiptController');

const router = express.Router();
router.use(authRequired);
router.post('/upload', upload.single('file'), ctrl.uploadReceipt);
router.post('/:id/save', ctrl.saveReceiptTransaction);

module.exports = router;
