const prisma = require('../lib/prisma');
const { toNumber, startOfMonth, endOfMonth, monthKey } = require('../utils/helpers');

async function getOwnedOrThrow(model, id, userId, label = 'Record') {
  const { AppError } = require('../middleware/errorHandler');
  const record = await prisma[model].findFirst({ where: { id, userId } });
  if (!record) throw new AppError(`${label} not found.`, 404, 'NOT_FOUND');
  return record;
}

async function monthlyTotals(userId, date = new Date()) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const txs = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
  });
  const income = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + toNumber(t.amount), 0);
  const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + toNumber(t.amount), 0);
  return { income, expenses, savings: income - expenses, count: txs.length, txs };
}

async function lifetimeBalance(userId) {
  const txs = await prisma.transaction.findMany({ where: { userId } });
  const income = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + toNumber(t.amount), 0);
  const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + toNumber(t.amount), 0);
  return { income, expenses, balance: income - expenses };
}

async function categorySpend(userId, start, end) {
  const txs = await prisma.transaction.findMany({
    where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
  });
  const map = {};
  for (const t of txs) {
    map[t.category] = (map[t.category] || 0) + toNumber(t.amount);
  }
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

async function buildFinanceSnapshot(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const now = new Date();
  const thisMonth = await monthlyTotals(userId, now);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const lastMonth = await monthlyTotals(userId, prev);
  const lifetime = await lifetimeBalance(userId);
  const budgets = await prisma.budget.findMany({
    where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
  });
  const goals = await prisma.savingsGoal.findMany({ where: { userId } });
  const bills = await prisma.bill.findMany({ where: { userId } });
  const emergency = await prisma.emergencyFund.findUnique({ where: { userId } });
  const categoryThis = await categorySpend(userId, startOfMonth(now), endOfMonth(now));
  const categoryLast = await categorySpend(userId, startOfMonth(prev), endOfMonth(prev));

  const budgetUsage = budgets.map((b) => {
    const spent = thisMonth.txs
      .filter((t) => t.type === 'EXPENSE' && t.category === b.category)
      .reduce((s, t) => s + toNumber(t.amount), 0);
    const amount = toNumber(b.amount);
    const pct = amount > 0 ? (spent / amount) * 100 : 0;
    return {
      id: b.id,
      category: b.category,
      budget: amount,
      spent,
      remaining: amount - spent,
      percent: Math.round(pct * 10) / 10,
      status: pct > 100 ? 'exceeded' : pct > 90 ? 'almost' : pct >= 70 ? 'warning' : 'normal',
    };
  });

  const upcomingBills = bills.filter((b) => b.status !== 'PAID');
  const upcomingTotal = upcomingBills.reduce((s, b) => s + toNumber(b.amount), 0);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncomeTarget: toNumber(user.monthlyIncomeTarget),
      monthlySavingsTarget: toNumber(user.monthlySavingsTarget),
      financialGoal: user.financialGoal,
    },
    thisMonth,
    lastMonth,
    lifetime,
    budgetUsage,
    goals: (goals || []).map((g) => ({
      ...g,
      targetAmount: toNumber(g.targetAmount),
      currentAmount: toNumber(g.currentAmount),
      progress: toNumber(g.targetAmount) > 0 ? (toNumber(g.currentAmount) / toNumber(g.targetAmount)) * 100 : 0,
    })),
    bills: bills.map((b) => ({ ...b, amount: toNumber(b.amount) })),
    upcomingBills: upcomingBills.map((b) => ({ ...b, amount: toNumber(b.amount) })),
    upcomingBillsTotal: upcomingTotal,
    emergency: emergency
      ? {
          ...emergency,
          monthlyEssential: toNumber(emergency.monthlyEssential),
          currentAmount: toNumber(emergency.currentAmount),
          recommended: toNumber(emergency.monthlyEssential) * emergency.targetMonths,
        }
      : null,
    categoryThis,
    categoryLast,
    savingsRate: thisMonth.income > 0 ? (thisMonth.savings / thisMonth.income) * 100 : 0,
  };
}

function computeHealthScore(snapshot) {
  const reasons = { good: [], attention: [], risk: [] };
  let score = 50;

  const sr = snapshot.savingsRate;
  if (sr >= 20) {
    score += 15;
    reasons.good.push('Healthy savings rate');
  } else if (sr >= 10) {
    score += 8;
    reasons.attention.push('Savings rate could be higher');
  } else {
    score -= 8;
    reasons.risk.push('Low savings rate this month');
  }

  const over = snapshot.budgetUsage.filter((b) => b.percent > 100).length;
  const warn = snapshot.budgetUsage.filter((b) => b.percent >= 70 && b.percent <= 100).length;
  if (snapshot.budgetUsage.length && over === 0) {
    score += 12;
    reasons.good.push('Budgets are under control');
  }
  if (warn) reasons.attention.push(`${warn} budget${warn > 1 ? 's' : ''} approaching the limit`);
  if (over) {
    score -= 12;
    reasons.risk.push(`${over} budget${over > 1 ? 's' : ''} exceeded`);
  }

  const ratio = snapshot.thisMonth.income > 0 ? snapshot.thisMonth.expenses / snapshot.thisMonth.income : 1;
  if (ratio <= 0.7) {
    score += 10;
    reasons.good.push('Expenses are well below income');
  } else if (ratio > 1) {
    score -= 15;
    reasons.risk.push('Expenses exceed income this month');
  } else {
    reasons.attention.push('Expense-to-income ratio is elevated');
  }

  if (snapshot.emergency) {
    const rec = snapshot.emergency.recommended || 1;
    const pct = (snapshot.emergency.currentAmount / rec) * 100;
    if (pct >= 100) {
      score += 10;
      reasons.good.push('Emergency fund target met');
    } else if (pct >= 50) {
      score += 5;
      reasons.attention.push('Emergency fund is halfway there');
    } else {
      score -= 5;
      reasons.attention.push('Emergency fund needs attention');
    }
  }

  const overdue = snapshot.bills.filter((b) => b.status === 'OVERDUE').length;
  const paid = snapshot.bills.filter((b) => b.status === 'PAID').length;
  if (snapshot.bills.length && overdue === 0) {
    score += 8;
    reasons.good.push('Bills are being paid on time');
  }
  if (overdue) {
    score -= 12;
    reasons.risk.push(`${overdue} overdue bill${overdue > 1 ? 's' : ''}`);
  }
  if (paid) reasons.good.push('Recent bills marked as paid');

  const avgGoal =
    snapshot.goals.length > 0
      ? snapshot.goals.reduce((s, g) => s + g.progress, 0) / snapshot.goals.length
      : 0;
  if (avgGoal >= 50) {
    score += 8;
    reasons.good.push('Savings goals are progressing well');
  } else if (snapshot.goals.length) {
    reasons.attention.push('Savings goals need more contributions');
  }

  if (snapshot.upcomingBillsTotal > snapshot.lifetime.balance) {
    score -= 10;
    reasons.risk.push('Upcoming bills exceed current balance');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, reasons };
}

module.exports = {
  getOwnedOrThrow,
  monthlyTotals,
  lifetimeBalance,
  categorySpend,
  buildFinanceSnapshot,
  computeHealthScore,
  monthKey,
};
