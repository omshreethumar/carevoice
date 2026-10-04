# Pocket Planner – AI Personal Finance Manager

Pocket Planner helps students and young professionals with irregular income track expenses, stay on budget, build savings goals, and get AI-powered guidance. It is a full-stack app: React frontend, Express API, PostgreSQL via Prisma, JWT auth, and OpenAI calls that run only on the server.

This is an educational money manager, not professional financial advice.

## Features

- Public landing page, registration, login, forgot/reset password, demo mode
- JWT authentication with bcrypt password hashing and protected routes
- Dashboard: balances, income vs expenses, category charts, bills, goals, AI insights
- Transactions: CRUD, search, filter, sort, pagination, rule-based categories
- CSV import with preview, validation, and duplicate detection
- Receipt upload with AI extraction when configured, plus a manual fallback
- Monthly budgets with usage warnings
- Savings goals with add/withdraw and required monthly saving
- Bills: upcoming, overdue, paid, recurring frequencies
- Analytics over 7d / 30d / 3m / 6m / 1y from real transactions
- Spending prediction (Node linear regression; optional Python scikit-learn)
- Pocket AI chat grounded in the user’s ledger
- Financial health score (0–100) with explanations
- Emergency fund tracker
- INR default currency, switchable in profile

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Recharts, Lucide |
| Backend | Node.js, Express |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT, bcryptjs |
| AI | OpenAI API via `OPENAI_API_KEY` on the server only |
| ML | Node prediction by default; `ml-service/predictor.py` optional |

## Architecture

```
client (Vite :5173)
  └── /api proxy ──► server (Express :5000)
                       ├── Prisma ──► PostgreSQL
                       ├── OpenAI (chat + optional receipt vision)
                       └── optional python ml-service/predictor.py
```

Every resource query includes `userId` from the JWT. Users cannot read another user’s transactions, budgets, bills, or chats.

## Project structure

```
client/                 React app
server/src/             Express API, routes, controllers, services
prisma/schema.prisma    Data model
prisma/seed.js          Demo user seed
ml-service/             Optional scikit-learn predictor
```

## Database schema (models)

User, Transaction, Budget, SavingsGoal, Bill, FinancialInsight, AIConversation, AIMessage, Receipt, ImportBatch, ImportedTransaction, EmergencyFund.

See `prisma/schema.prisma` for fields and relations.

## API endpoints

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | No |
| POST | `/api/auth/demo` | No |
| POST | `/api/auth/forgot-password` | No |
| POST | `/api/auth/reset-password` | No |
| GET/PUT | `/api/users/me` | Yes |
| GET/PUT | `/api/users/me/emergency-fund` | Yes |
| GET/POST | `/api/transactions` | Yes |
| PUT/DELETE | `/api/transactions/:id` | Yes |
| POST | `/api/transactions/import` | Yes |
| POST | `/api/transactions/import/confirm` | Yes |
| GET/POST | `/api/budgets` | Yes |
| PUT/DELETE | `/api/budgets/:id` | Yes |
| GET/POST | `/api/goals` | Yes |
| PUT/DELETE | `/api/goals/:id` | Yes |
| GET/POST | `/api/bills` | Yes |
| PUT/DELETE | `/api/bills/:id` | Yes |
| GET | `/api/analytics` | Yes |
| GET | `/api/analytics/dashboard` | Yes |
| GET | `/api/predictions` | Yes |
| GET | `/api/insights` | Yes |
| POST | `/api/ai/chat` | Yes |
| POST | `/api/receipts/upload` | Yes |

## Environment variables

Copy `.env.example` to `.env`:

```
DATABASE_URL=
JWT_SECRET=
OPENAI_API_KEY=
```

Never put `OPENAI_API_KEY` in frontend code. The Vite app only calls `/api/*`.

## Local setup

1. Install Node.js 20+ and PostgreSQL 16.
2. Create a database named `pocket_planner`.
3. Copy env file and set `DATABASE_URL` and `JWT_SECRET`.

```bash
copy .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
```

### Running PostgreSQL with Docker

```bash
docker compose up -d
```

### Running backend

```bash
npm run dev:server
```

API: http://localhost:5000/api/health

### Running frontend

```bash
npm run dev:client
```

App: http://localhost:5173

Or both: `npm run dev`

## Demo

Click **View Demo** / **Try Demo**, or sign in with:

- Email: `alex.demo@pocketplanner.app`
- Password: `Demo@1234`

This is a fictional Alex Sharma account (₹45,000 income / ₹31,500 expenses / ₹13,500 savings). Demo data is reset on each demo login and is never mixed into normal registrations.

## Screenshots

Add product screenshots here after running the app:

- Landing
- Dashboard
- Transactions
- Pocket AI

## Deployment

1. Provision PostgreSQL and set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, and optional `OPENAI_API_KEY`.
2. `npx prisma migrate deploy`
3. Build the client: `npm run build -w client`
4. Host the Vite `client/dist` on a static host or serve it from Express.
5. Run `npm run start -w server` behind HTTPS.
6. Point the frontend API base URL at the server if you are not using the Vite proxy.

## Future improvements

- Email delivery for password reset
- Dedicated Python FastAPI ML service with category clustering
- Native OCR (Tesseract) for PDFs without OpenAI
- Recurring transaction templates and push bill reminders
- Multi-currency conversion rates

## Author

Built as Pocket Planner – AI Personal Finance Manager.
