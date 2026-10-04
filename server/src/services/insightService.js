const prisma = require('../lib/prisma');
const { buildFinanceSnapshot } = require('./financeService');
const { toNumber } = require('../utils/helpers');

function currency(amount, code = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

async function generateInsights(userId) {
  const snap = await buildFinanceSnapshot(userId);
  const cur = snap.user.currency || 'INR';
  const insights = [];

  for (const cat of snap.categoryThis) {
    const prev = snap.categoryLast.find((c) => c.category === cat.category);
    if (prev && prev.amount > 0) {
      const change = ((cat.amount - prev.amount) / prev.amount) * 100;
      if (Math.abs(change) >= 10) {
        insights.push({
          type: 'category_change',
          title: `${cat.category} spending ${change > 0 ? 'increased' : 'decreased'}`,
          message: `Your ${cat.category.toLowerCase()} spending ${change > 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(change))}% this month.`,
          severity: change > 0 ? 'warning' : 'info',
          metadata: { category: cat.category, change },
        });
      }
    }
  }

  if (snap.upcomingBillsTotal > 0) {
    insights.push({
      type: 'bills',
      title: 'Upcoming bills',
      message: `You have ${currency(snap.upcomingBillsTotal, cur)} in upcoming bills.`,
      severity: 'info',
      metadata: { total: snap.upcomingBillsTotal },
    });
  }

  if (snap.lastMonth.income > 0) {
    const prevRate = (snap.lastMonth.savings / snap.lastMonth.income) * 100;
    if (Math.abs(snap.savingsRate - prevRate) >= 3) {
      insights.push({
        type: 'savings_rate',
        title: 'Savings rate change',
        message: `Your savings rate moved from ${Math.round(prevRate)}% to ${Math.round(snap.savingsRate)}%.`,
        severity: snap.savingsRate > prevRate ? 'info' : 'warning',
      });
    }
  }

  for (const b of snap.budgetUsage) {
    if (b.percent >= 70) {
      insights.push({
        type: 'budget',
        title: `${b.category} budget`,
        message: `Your ${b.category.toLowerCase()} budget is ${b.percent}% used.`,
        severity: b.percent > 100 ? 'danger' : b.percent > 90 ? 'warning' : 'warning',
      });
    }
  }

  for (const g of snap.goals) {
    const remaining = g.targetAmount - g.currentAmount;
    const daysLeft = Math.max(1, Math.ceil((new Date(g.targetDate) - new Date()) / 86400000));
    if (remaining > 0 && daysLeft > 0) {
      const daily = remaining / daysLeft;
      const onTrack = snap.thisMonth.savings / 30 >= daily;
      insights.push({
        type: 'goal',
        title: g.name,
        message: onTrack
          ? `You are on track to reach your ${g.name} goal by ${new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.`
          : `To reach ${g.name} on time, save about ${currency(daily * 30, cur)} per month.`,
        severity: onTrack ? 'info' : 'warning',
      });
    }
  }

  if (snap.thisMonth.income > 0 && snap.categoryThis[0]) {
    const top = snap.categoryThis[0];
    const share = (top.amount / snap.thisMonth.expenses) * 100;
    const cut = Math.min(1500, Math.round(top.amount * 0.12));
    if (cut > 0 && snap.user.monthlySavingsTarget) {
      const extraDays = Math.round((cut / (toNumber(snap.user.monthlySavingsTarget) / 30)) || 0);
      insights.push({
        type: 'ai_style',
        title: 'Spending opportunity',
        message: `Your ${top.category.toLowerCase()} spending is ${Math.round(share)}% of this month's expenses. Reducing it by ${currency(cut, cur)} could help you reach your savings target sooner${extraDays > 0 ? ` (about ${extraDays} days earlier)` : ''}.`,
        severity: 'info',
      });
    }
  }

  await prisma.financialInsight.deleteMany({ where: { userId } });
  if (insights.length) {
    await prisma.financialInsight.createMany({
      data: insights.slice(0, 12).map((i) => ({ ...i, userId })),
    });
  }
  return prisma.financialInsight.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { generateInsights, currency };
