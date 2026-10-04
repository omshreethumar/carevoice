const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const DEMO_EMAIL = 'alex.demo@pocketplanner.app';
const DEMO_PASSWORD = 'Demo@1234';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function seedDemoForUser(userId) {
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.savingsGoal.deleteMany({ where: { userId } });
  await prisma.bill.deleteMany({ where: { userId } });
  await prisma.financialInsight.deleteMany({ where: { userId } });
  await prisma.aIConversation.deleteMany({ where: { userId } });
  await prisma.receipt.deleteMany({ where: { userId } });
  await prisma.importBatch.deleteMany({ where: { userId } });
  await prisma.emergencyFund.deleteMany({ where: { userId } });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const incomeTx = [];
  for (let m = 5; m >= 0; m -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 2);
    incomeTx.push({
      userId,
      amount: 32000,
      type: 'INCOME',
      category: 'Salary',
      description: 'Part-time salary',
      date: d,
      paymentMethod: 'BANK_TRANSFER',
      source: 'demo',
    });
    incomeTx.push({
      userId,
      amount: 13000,
      type: 'INCOME',
      category: 'Freelance',
      description: 'Freelance design project',
      date: new Date(now.getFullYear(), now.getMonth() - m, 18),
      paymentMethod: 'UPI',
      source: 'demo',
    });
  }

  const expenses = [
    ['Swiggy weekend order', 'Food', 620, 'UPI', 2],
    ['Zomato lunch', 'Food', 340, 'UPI', 4],
    ['Uber to campus', 'Transport', 180, 'UPI', 3],
    ['Metro card recharge', 'Transport', 500, 'UPI', 8],
    ['Amazon earphones', 'Shopping', 1499, 'CARD', 10],
    ['Netflix', 'Subscriptions', 649, 'CARD', 6],
    ['Spotify', 'Subscriptions', 119, 'UPI', 7],
    ['PVR movies', 'Entertainment', 780, 'CARD', 12],
    ['Udemy React course', 'Education', 549, 'CARD', 15],
    ['Airtel broadband', 'Bills', 999, 'UPI', 5],
    ['Electricity bill', 'Bills', 1450, 'UPI', 9],
    ['Apollo pharmacy', 'Healthcare', 420, 'UPI', 14],
    ['PG rent', 'Rent', 12000, 'BANK_TRANSFER', 1],
    ['Flipkart groceries', 'Shopping', 2100, 'UPI', 11],
    ['Cafe Coffee Day', 'Food', 260, 'UPI', 13],
    ['Ola to station', 'Transport', 240, 'UPI', 16],
    ['BookMyShow concert', 'Entertainment', 1200, 'CARD', 18],
    ['Pharmacy vitamins', 'Healthcare', 350, 'UPI', 20],
    ['Dominos', 'Food', 499, 'UPI', 21],
    ['Jio recharge', 'Bills', 299, 'UPI', 22],
  ];

  const expenseRows = [];
  for (let m = 5; m >= 0; m -= 1) {
    for (const [description, category, amount, paymentMethod, day] of expenses) {
      const bump = m === 0 && category === 'Food' ? 1.18 : 1;
      const date = new Date(now.getFullYear(), now.getMonth() - m, Math.min(day, 28));
      expenseRows.push({
        userId,
        amount: Math.round(amount * bump),
        type: 'EXPENSE',
        category,
        description,
        date,
        paymentMethod,
        source: 'demo',
      });
    }
  }

  await prisma.transaction.createMany({ data: [...incomeTx, ...expenseRows] });

  await prisma.budget.createMany({
    data: [
      { userId, category: 'Food', amount: 5000, month, year },
      { userId, category: 'Transport', amount: 2000, month, year },
      { userId, category: 'Entertainment', amount: 1500, month, year },
      { userId, category: 'Shopping', amount: 4000, month, year },
      { userId, category: 'Subscriptions', amount: 1000, month, year },
    ],
  });

  await prisma.savingsGoal.createMany({
    data: [
      {
        userId,
        name: 'New Laptop',
        targetAmount: 70000,
        currentAmount: 32000,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 4, 1),
        category: 'Electronics',
      },
      {
        userId,
        name: 'Emergency buffer',
        targetAmount: 50000,
        currentAmount: 18000,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 8, 1),
        category: 'Emergency',
      },
    ],
  });

  await prisma.bill.createMany({
    data: [
      {
        userId,
        name: 'PG Rent',
        amount: 12000,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 28),
        category: 'Rent',
        recurring: true,
        frequency: 'MONTHLY',
        status: 'UPCOMING',
      },
      {
        userId,
        name: 'Netflix',
        amount: 649,
        dueDate: new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 3, 28)),
        category: 'Subscriptions',
        recurring: true,
        frequency: 'MONTHLY',
        status: 'UPCOMING',
      },
      {
        userId,
        name: 'Gym membership',
        amount: 999,
        dueDate: daysAgo(4),
        category: 'Healthcare',
        recurring: true,
        frequency: 'MONTHLY',
        status: 'OVERDUE',
      },
      {
        userId,
        name: 'Electricity',
        amount: 1450,
        dueDate: daysAgo(12),
        category: 'Bills',
        recurring: true,
        frequency: 'MONTHLY',
        status: 'PAID',
      },
    ],
  });

  await prisma.emergencyFund.create({
    data: {
      userId,
      monthlyEssential: 25000,
      targetMonths: 6,
      currentAmount: 75000,
    },
  });
}

async function ensureDemoUser() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: 'Alex Sharma',
      isDemo: true,
      monthlyIncomeTarget: 45000,
      monthlySavingsTarget: 13500,
      financialGoal: 'Build a 6-month emergency fund and buy a laptop',
      currency: 'INR',
      passwordHash,
    },
    create: {
      name: 'Alex Sharma',
      email: DEMO_EMAIL,
      passwordHash,
      isDemo: true,
      monthlyIncomeTarget: 45000,
      monthlySavingsTarget: 13500,
      financialGoal: 'Build a 6-month emergency fund and buy a laptop',
      currency: 'INR',
    },
  });
  await seedDemoForUser(user.id);
  return user;
}

module.exports = { ensureDemoUser, seedDemoForUser, DEMO_EMAIL, DEMO_PASSWORD };
