const prisma = require('../lib/prisma');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { serialize, toNumber } = require('../utils/helpers');

function withProgress(goal) {
  const target = toNumber(goal.targetAmount);
  const current = toNumber(goal.currentAmount);
  const progress = target > 0 ? (current / target) * 100 : 0;
  const remaining = Math.max(0, target - current);
  const daysLeft = Math.max(0, Math.ceil((new Date(goal.targetDate) - new Date()) / 86400000));
  const monthsLeft = Math.max(1 / 30, daysLeft / 30);
  const requiredMonthly = remaining / monthsLeft;
  let expectedCompletion = null;
  if (requiredMonthly > 0 && current > 0) {
    const rate = current; // cannot infer rate from current alone
    expectedCompletion = goal.targetDate;
  }
  const created = new Date(goal.createdAt);
  const elapsedMonths = Math.max(1 / 30, (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const monthlyRate = current / elapsedMonths;
  if (monthlyRate > 0 && remaining > 0) {
    const monthsNeeded = remaining / monthlyRate;
    expectedCompletion = new Date(Date.now() + monthsNeeded * 30 * 86400000).toISOString();
  }
  return {
    ...serialize(goal),
    progress: Math.round(progress * 10) / 10,
    remaining,
    requiredMonthly: Math.round(requiredMonthly),
    expectedCompletion,
    daysLeft,
  };
}

const list = asyncHandler(async (req, res) => {
  const rows = await prisma.savingsGoal.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: rows.map(withProgress) });
});

const create = asyncHandler(async (req, res) => {
  const { name, targetAmount, currentAmount, targetDate, category } = req.body;
  if (!name) throw new AppError('Goal name is required.');
  const target = Number(targetAmount);
  if (!Number.isFinite(target) || target <= 0) throw new AppError('Enter a valid target amount.');
  if (!targetDate) throw new AppError('Target date is required.');
  const row = await prisma.savingsGoal.create({
    data: {
      userId: req.userId,
      name: String(name).trim(),
      targetAmount: target,
      currentAmount: Number(currentAmount) || 0,
      targetDate: new Date(targetDate),
      category: category || 'General',
    },
  });
  res.status(201).json({ success: true, data: withProgress(row) });
});

const update = asyncHandler(async (req, res) => {
  const existing = await prisma.savingsGoal.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError('Goal not found.', 404, 'NOT_FOUND');
  const { action, amount, name, targetAmount, targetDate, category } = req.body;
  const data = {};
  if (action === 'add' || action === 'withdraw') {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) throw new AppError('Enter a valid amount.');
    const next =
      action === 'add' ? toNumber(existing.currentAmount) + value : toNumber(existing.currentAmount) - value;
    if (next < 0) throw new AppError('Cannot withdraw more than the saved amount.');
    data.currentAmount = next;
  }
  if (name) data.name = String(name).trim();
  if (targetAmount !== undefined) {
    const t = Number(targetAmount);
    if (!Number.isFinite(t) || t <= 0) throw new AppError('Enter a valid target amount.');
    data.targetAmount = t;
  }
  if (targetDate) data.targetDate = new Date(targetDate);
  if (category) data.category = category;
  const row = await prisma.savingsGoal.update({ where: { id: existing.id }, data });
  res.json({ success: true, data: withProgress(row) });
});

const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.savingsGoal.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError('Goal not found.', 404, 'NOT_FOUND');
  await prisma.savingsGoal.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { id: existing.id } });
});

module.exports = { list, create, update, remove };
