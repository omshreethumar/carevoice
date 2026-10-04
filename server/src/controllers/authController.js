const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { signToken } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { serialize } = require('../utils/helpers');
const { ensureDemoUser } = require('../services/demoService');

function publicUser(user) {
  return serialize({
    id: user.id,
    name: user.name,
    email: user.email,
    monthlyIncomeTarget: user.monthlyIncomeTarget,
    currency: user.currency,
    financialGoal: user.financialGoal,
    monthlySavingsTarget: user.monthlySavingsTarget,
    isDemo: user.isDemo,
    createdAt: user.createdAt,
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required.');
  }
  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match.');
  }
  if (String(password).length < 8) {
    throw new AppError('Password must be at least 8 characters.');
  }
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw new AppError('An account with this email already exists.', 409, 'DUPLICATE_EMAIL');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      currency: 'INR',
    },
  });
  const token = signToken(user);
  res.status(201).json({ success: true, data: { user: publicUser(user), token } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) throw new AppError('Email and password are required.');
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user) throw new AppError('Invalid email or password.', 401, 'INVALID_LOGIN');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError('Invalid email or password.', 401, 'INVALID_LOGIN');
  const token = signToken(user, Boolean(rememberMe));
  res.json({ success: true, data: { user: publicUser(user), token } });
});

const logout = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { message: 'Signed out.' } });
});

const demo = asyncHandler(async (_req, res) => {
  const user = await ensureDemoUser();
  const token = signToken(user, true);
  res.json({ success: true, data: { user: publicUser(user), token } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!email) throw new AppError('Email is required.');
  const user = await prisma.user.findUnique({ where: { email } });
  const payload = {
    message: 'If an account exists for that email, a reset link has been generated.',
  };
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashed,
        passwordResetExpires: new Date(Date.now() + 1000 * 60 * 30),
      },
    });
    if (process.env.NODE_ENV !== 'production') {
      payload.devResetToken = token;
    }
  }
  res.json({ success: true, data: payload });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  if (!token || !password) throw new AppError('Token and new password are required.');
  if (password !== confirmPassword) throw new AppError('Passwords do not match.');
  if (String(password).length < 8) throw new AppError('Password must be at least 8 characters.');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: hashed, passwordResetExpires: { gt: new Date() } },
  });
  if (!user) throw new AppError('This reset link is invalid or has expired.', 400, 'INVALID_TOKEN');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
  res.json({ success: true, data: { message: 'Password updated. You can sign in now.' } });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: publicUser(user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, monthlyIncomeTarget, currency, financialGoal, monthlySavingsTarget } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(monthlyIncomeTarget !== undefined ? { monthlyIncomeTarget: Number(monthlyIncomeTarget) || 0 } : {}),
      ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {}),
      ...(financialGoal !== undefined ? { financialGoal: String(financialGoal) } : {}),
      ...(monthlySavingsTarget !== undefined ? { monthlySavingsTarget: Number(monthlySavingsTarget) || 0 } : {}),
    },
  });
  res.json({ success: true, data: publicUser(user) });
});

module.exports = { register, login, logout, demo, forgotPassword, resetPassword, me, updateMe };
