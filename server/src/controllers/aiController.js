const prisma = require('../lib/prisma');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { chatWithPocketAI } = require('../services/aiService');
const { serialize } = require('../utils/helpers');

const chat = asyncHandler(async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message) throw new AppError('Please enter a message.');
  const result = await chatWithPocketAI(req.userId, message, req.body.conversationId);
  res.json({ success: true, data: result });
});

const conversations = asyncHandler(async (req, res) => {
  const rows = await prisma.aIConversation.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    take: 10,
  });
  res.json({ success: true, data: serialize(rows) });
});

module.exports = { chat, conversations };
