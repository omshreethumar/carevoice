const { spawn } = require('child_process');
const path = require('path');
const prisma = require('../lib/prisma');
const { toNumber, monthKey, startOfMonth, endOfMonth } = require('../utils/helpers');
const { buildFinanceSnapshot } = require('./financeService');

function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.value);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (!denom) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, next: intercept + slope * n };
}

async function monthlySeries(userId) {
  const txs = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
  const map = {};
  for (const t of txs) {
    const key = monthKey(t.date);
    if (!map[key]) map[key] = { month: key, income: 0, expenses: 0 };
    if (t.type === 'INCOME') map[key].income += toNumber(t.amount);
    else map[key].expenses += toNumber(t.amount);
  }
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

function nodePredict(series, snap) {
  if (series.length < 2) {
    return {
      enoughData: false,
      message: 'Not enough transaction history. Add more transactions to generate a prediction.',
    };
  }
  const expenseFit = linearRegression(series.map((s) => ({ value: s.expenses })));
  const incomeFit = linearRegression(series.map((s) => ({ value: s.income })));
  const expectedExpenses = Math.max(0, Math.round(expenseFit.next));
  const expectedIncome = Math.max(0, Math.round(incomeFit.next));
  const expectedSavings = expectedIncome - expectedExpenses;

  const highRisk = snap.budgetUsage
    .filter((b) => {
      const catSeries = snap.categoryThis.find((c) => c.category === b.category);
      return b.percent >= 80 || (catSeries && b.budget > 0 && catSeries.amount / b.budget > 0.8);
    })
    .map((b) => ({
      category: b.category,
      reason:
        b.percent > 100
          ? 'Already exceeded this month'
          : 'Likely to overrun based on current spend',
      percent: b.percent,
    }));

  const overruns = snap.budgetUsage
    .filter((b) => b.percent >= 90)
    .map((b) => ({
      category: b.category,
      budget: b.budget,
      spent: b.spent,
      projected: Math.round(b.spent * (30 / Math.max(1, new Date().getDate()))),
    }));

  return {
    enoughData: true,
    method: 'node_linear_regression',
    monthsUsed: series.length,
    expectedMonthlyExpenses: expectedExpenses,
    expectedMonthlyIncome: expectedIncome,
    expectedSavings,
    highRiskCategories: highRisk,
    possibleBudgetOverruns: overruns,
    series,
  };
}

function tryPythonPredict(series) {
  return new Promise((resolve) => {
    const script = path.join(__dirname, '../../../ml-service/predictor.py');
    const child = spawn('python', [script], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let timedOut = false;
    const t = setTimeout(() => {
      timedOut = true;
      child.kill();
      resolve(null);
    }, 4000);
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.on('error', () => {
      clearTimeout(t);
      resolve(null);
    });
    child.on('close', () => {
      clearTimeout(t);
      if (timedOut) return;
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve(null);
      }
    });
    child.stdin.write(JSON.stringify({ series }));
    child.stdin.end();
  });
}

async function predictSpending(userId) {
  const series = await monthlySeries(userId);
  const snap = await buildFinanceSnapshot(userId);
  const js = nodePredict(series, snap);
  if (process.env.USE_PYTHON_ML === 'true' && js.enoughData) {
    const py = await tryPythonPredict(series);
    if (py && py.enoughData) {
      return { ...js, ...py, method: 'python_sklearn', fallbackAvailable: true };
    }
  }
  return js;
}

module.exports = { predictSpending, monthlySeries, nodePredict };
