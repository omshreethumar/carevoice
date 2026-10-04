const prisma = require('../lib/prisma');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { processReceiptFile } = require('../services/receiptService');
const { serialize, toNumber } = require('../utils/helpers');
const { categorizeDescription } = require('../utils/constants');

const uploadReceipt = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload an image or PDF.', 400, 'INVALID_FILE');
  const processed = await processReceiptFile(req.file);
  const extraction = processed.extraction || {};
  const row = await prisma.receipt.create({
    data: {
      userId: req.userId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      status: processed.status,
      merchantName: extraction.merchantName || null,
      amount: extraction.amount || null,
      date: extraction.date ? new Date(extraction.date) : null,
      items: extraction.items || null,
      suggestedCategory: extraction.suggestedCategory || categorizeDescription(extraction.merchantName || '', 'EXPENSE'),
      rawExtraction: extraction || null,
      errorMessage: processed.errorMessage,
    },
  });
  res.status(201).json({
    success: true,
    data: serialize(row),
    meta: {
      ocrConfigured: processed.status !== 'unavailable',
      message: processed.errorMessage,
    },
  });
});

const saveReceiptTransaction = asyncHandler(async (req, res) => {
  const receipt = await prisma.receipt.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!receipt) throw new AppError('Receipt not found.', 404, 'NOT_FOUND');
  const amount = Number(req.body.amount ?? receipt.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new AppError('Enter a valid amount.');
  const tx = await prisma.transaction.create({
    data: {
      userId: req.userId,
      amount,
      type: 'EXPENSE',
      category: req.body.category || receipt.suggestedCategory || 'Other',
      description: req.body.description || receipt.merchantName || 'Receipt',
      date: req.body.date ? new Date(req.body.date) : receipt.date || new Date(),
      paymentMethod: req.body.paymentMethod || 'OTHER',
      notes: req.body.notes || 'Created from receipt',
      source: 'receipt',
    },
  });
  const updated = await prisma.receipt.update({
    where: { id: receipt.id },
    data: { transactionId: tx.id, status: 'saved', merchantName: req.body.description || receipt.merchantName, amount },
  });
  res.json({ success: true, data: { receipt: serialize(updated), transaction: serialize(tx) } });
});

module.exports = { uploadReceipt, saveReceiptTransaction };
