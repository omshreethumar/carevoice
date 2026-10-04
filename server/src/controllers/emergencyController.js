const prisma = require('../lib/prisma');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { serialize, toNumber } = require('../utils/helpers');

const get = asyncHandler(async (req, res) => {
  const row = await prisma.emergencyFund.findUnique({ where: { userId: req.userId } });
  if (!row) {
    return res.json({
      success: true,
      data: {
        monthlyEssential: 0,
        targetMonths: 6,
        currentAmount: 0,
        recommended: 0,
        progress: 0,
      },
    });
  }
  const recommended = toNumber(row.monthlyEssential) * row.targetMonths;
  res.json({
    success: true,
    data: {
      ...serialize(row),
      recommended,
      progress: recommended > 0 ? (toNumber(row.currentAmount) / recommended) * 100 : 0,
    },
  });
});

const upsert = asyncHandler(async (req, res) => {
  const monthlyEssential = Number(req.body.monthlyEssential);
  const targetMonths = Number(req.body.targetMonths) || 6;
  const currentAmount = Number(req.body.currentAmount);
  if (!Number.isFinite(monthlyEssential) || monthlyEssential < 0) {
    throw new AppError('Enter a valid monthly essential expense.');
  }
  if (targetMonths < 1 || targetMonths > 24) throw new AppError('Target months must be between 1 and 24.');
  if (!Number.isFinite(currentAmount) || currentAmount < 0) throw new AppError('Enter a valid current amount.');
  const row = await prisma.emergencyFund.upsert({
    where: { userId: req.userId },
    update: { monthlyEssential, targetMonths, currentAmount },
    create: { userId: req.userId, monthlyEssential, targetMonths, currentAmount },
  });
  const recommended = toNumber(row.monthlyEssential) * row.targetMonths;
  res.json({
    success: true,
    data: {
      ...serialize(row),
      recommended,
      progress: recommended > 0 ? (toNumber(row.currentAmount) / recommended) * 100 : 0,
    },
  });
});

module.exports = { get, upsert };
