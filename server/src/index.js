const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Using a development fallback.');
  process.env.JWT_SECRET = 'dev-only-change-me';
}

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: ['https://carevoice-f762.vercel.app', 'http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  message: { success: false, error: { message: 'Too many attempts. Try again later.', code: 'RATE_LIMIT' } },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai/chat', rateLimit({ windowMs: 60 * 1000, limit: 20 }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    },
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/bills', require('./routes/bills'));
const { authRequired } = require('./middleware/auth');
const analyticsController = require('./controllers/analyticsController');

app.use('/api/analytics', require('./routes/analytics'));
app.get('/api/predictions', authRequired, analyticsController.predictions);
app.get('/api/insights', authRequired, analyticsController.insights);
app.use('/api/ai', require('./routes/ai'));
app.use('/api/receipts', require('./routes/receipts'));

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

const prisma = require('./lib/prisma');

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`Pocket Planner API running on http://localhost:${PORT}`);
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('PostgreSQL connection OK');
    } catch (err) {
      console.error('PostgreSQL connection failed. Check DATABASE_URL.', err.message);
    }
  });
}

module.exports = app;

