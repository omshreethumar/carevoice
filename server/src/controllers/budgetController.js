const prisma = require('../lib/prisma');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { serialize, toNumber } = require('../utils/helpers');
const { CATEGORIES } = require('../utils/constants');

function statusFor(percent) {
  if (percent > 100) return 'exceeded';
  if (percent > 90) return 'almost';
  if (percent >= 70) return 'warning';
  return 'normal';
}

const list = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const budgets = await prisma.budget.findMany({
    where: { userId: req.userId, month, year },
  });
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const txs = await prisma.transaction.findMany({
    where: { userId: req.userId, type: 'EXPENSE', date: { gte: start, lte: end } },
  });
  const data = budgets.map((b) => {
    const spent = txs
      .filter((t) => t.category === b.category)
      .reduce((s, t) => s + toNumber(t.amount), 0);
    const amount = toNumber(b.amount);
    const percent = amount > 0 ? (spent / amount) * 100 : 0;
    return {
      ...serialize(b),
      spent,
      remaining: amount - spent,
      percent: Math.round(percent * 10) / 10,
      status: statusFor(percent),
    };
  });
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const now = new Date();
  const { category, amount, month, year } = req.body;
  if (!CATEGORIES.includes(category)) throw new AppError('Invalid category.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new AppError('Enter a valid budget amount.');
  try {
    const row = await prisma.budget.create({
      data: {
        userId: req.userId,
        category,
        amount: value,
        month: Number(month) || now.getMonth() + 1,
        year: Number(year) || now.getFullYear(),
      },
    });
    res.status(201).json({ success: true, data: serialize(row) });
  } catch (err) {
    if (err.code === 'P2002') throw new AppError('A budget for this category already exists this month.', 409);
    throw err;
  }
});

const update = asyncHandler(async (req, res) => {
  const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError('Budget not found.', 404, 'NOT_FOUND');
  const data = {};
  if (req.body.amount !== undefined) {
    const value = Number(req.body.amount);
    if (!Number.isFinite(value) || value <= 0) throw new AppError('Enter a valid budget amount.');
    data.amount = value;
  }
  if (req.body.category) {
    if (!CATEGORIES.includes(req.body.category)) throw new AppError('Invalid category.');
    data.category = req.body.category;
  }
  const row = await prisma.budget.update({ where: { id: existing.id }, data });
  res.json({ success: true, data: serialize(row) });
});

const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError('Budget not found.', 404, 'NOT_FOUND');
  await prisma.budget.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { id: existing.id } });
});

module.exports = { list, create, update, remove };
