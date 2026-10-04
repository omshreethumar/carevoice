const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { rangeFromPeriod, toNumber, monthKey } = require('../utils/helpers');
const { buildFinanceSnapshot, computeHealthScore } = require('../services/financeService');
const { generateInsights } = require('../services/insightService');
const { predictSpending } = require('../services/predictionService');
const { serialize } = require('../utils/helpers');

const analytics = asyncHandler(async (req, res) => {
  const period = req.query.period || '30d';
  const { start, end } = rangeFromPeriod(period);
  const txs = await prisma.transaction.findMany({
    where: { userId: req.userId, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' },
  });

  const dailyMap = {};
  const weeklyMap = {};
  const monthlyMap = {};
  const categoryMap = {};
  let income = 0;
  let expenses = 0;

  for (const t of txs) {
    const d = new Date(t.date);
    const day = d.toISOString().slice(0, 10);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const week = weekStart.toISOString().slice(0, 10);
    const month = monthKey(d);
    const amt = toNumber(t.amount);
    if (!dailyMap[day]) dailyMap[day] = { date: day, income: 0, expenses: 0 };
    if (!weeklyMap[week]) weeklyMap[week] = { week, income: 0, expenses: 0 };
    if (!monthlyMap[month]) monthlyMap[month] = { month, income: 0, expenses: 0 };
    if (t.type === 'INCOME') {
      income += amt;
      dailyMap[day].income += amt;
      weeklyMap[week].income += amt;
      monthlyMap[month].income += amt;
    } else {
      expenses += amt;
      dailyMap[day].expenses += amt;
      weeklyMap[week].expenses += amt;
      monthlyMap[month].expenses += amt;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
    }
  }

  const days = Math.max(1, Math.round((end - start) / 86400000));
  const categories = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  res.json({
    success: true,
    data: {
      period,
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? (income - expenses) / income * 100 : 0,
      averageDailySpending: expenses / days,
      highestCategories: categories.slice(0, 5),
      categorySpending: categories,
      daily: Object.values(dailyMap),
      weekly: Object.values(weeklyMap),
      monthly: Object.values(monthlyMap),
    },
  });
});

const dashboard = asyncHandler(async (req, res) => {
  const snap = await buildFinanceSnapshot(req.userId);
  const health = computeHealthScore(snap);
  const insights = await generateInsights(req.userId);
  const recent = await prisma.transaction.findMany({
    where: { userId: req.userId },
    orderBy: { date: 'desc' },
    take: 8,
  });
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const txs = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: start, lte: end } },
    });
    months.push({
      month: d.toLocaleString('en-IN', { month: 'short' }),
      income: txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + toNumber(t.amount), 0),
      expenses: txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + toNumber(t.amount), 0),
    });
  }
  res.json({
    success: true,
    data: {
      balance: snap.lifetime.balance,
      totalIncome: snap.lifetime.income,
      totalExpenses: snap.lifetime.expenses,
      totalSavings: snap.lifetime.income - snap.lifetime.expenses,
      monthlyIncome: snap.thisMonth.income,
      monthlyExpenses: snap.thisMonth.expenses,
      savingsRate: snap.savingsRate,
      budgetUsage: snap.budgetUsage,
      incomeVsExpenses: months,
      categoryBreakdown: snap.categoryThis,
      goals: snap.goals,
      upcomingBills: snap.upcomingBills,
      recentTransactions: serialize(recent),
      insights: serialize(insights),
      health,
      emergency: snap.emergency,
      currency: snap.user.currency,
    },
  });
});

const insights = asyncHandler(async (req, res) => {
  const rows = await generateInsights(req.userId);
  res.json({ success: true, data: serialize(rows) });
});

const predictions = asyncHandler(async (req, res) => {
  const data = await predictSpending(req.userId);
  res.json({ success: true, data });
});

const health = asyncHandler(async (req, res) => {
  const snap = await buildFinanceSnapshot(req.userId);
  res.json({ success: true, data: computeHealthScore(snap) });
});

module.exports = { analytics, dashboard, insights, predictions, health };
