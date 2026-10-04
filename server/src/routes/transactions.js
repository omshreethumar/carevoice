const express = require('express');
const { authRequired } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const tx = require('../controllers/transactionController');

const router = express.Router();
router.use(authRequired);
router.get('/', tx.list);
router.post('/', tx.create);
router.post('/categorize', tx.suggestCategory);
router.post('/import', upload.single('file'), tx.previewImport);
router.post('/import/confirm', tx.confirmImport);
router.put('/:id', tx.update);
router.delete('/:id', tx.remove);

module.exports = router;
