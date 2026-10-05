import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatMoney } from '../utils/format';
import { ErrorBanner, ProgressBar, Spinner } from '../components/ui';

const COLORS = ['#0d9488', '#0369a1', '#d97706', '#7c3aed', '#dc2626', '#059669', '#ea580c'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const currency = user?.currency || data?.currency || 'INR';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;

  const cards = [
    { label: 'Total Balance', value: data?.balance },
    { label: 'Total Income', value: data?.totalIncome },
    { label: 'Total Expenses', value: data?.totalExpenses },
    { label: 'Total Savings', value: data?.totalSavings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hello, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">Your money snapshot for this month.</p>
      </div>
      <ErrorBanner message={error} onRetry={load} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{formatMoney(c.value, currency)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Monthly income</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(data?.monthlyIncome, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Monthly expenses</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(data?.monthlyExpenses, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Savings rate</p>
          <p className="mt-1 text-xl font-bold">{Math.round(data?.savingsRate || 0)}%</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Financial health</p>
          <p className="mt-1 text-xl font-bold">{data?.health?.score ?? '—'}/100</p>
          <p className="mt-1 text-xs text-slate-400">Educational score, not professional advice.</p>
        </div>
      </div>

      {data?.insights?.[0] ? (
        <div className="card flex gap-3 p-5">
          <Sparkles className="mt-0.5 text-brand-600" />
          <div>
            <p className="text-sm font-semibold">CareVoice AI insight</p>
            <p className="mt-1 text-sm text-slate-600">{data.insights[0].message}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Income vs Expenses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.incomeVsExpenses || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
                <Bar dataKey="income" fill="#0d9488" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#fb7185" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Monthly spending trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.incomeVsExpenses || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
                <Area type="monotone" dataKey="expenses" stroke="#0f766e" fill="#ccfbf1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Expense category breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.categoryBreakdown || []} dataKey="amount" nameKey="category" innerRadius={50} outerRadius={80}>
                  {(data?.categoryBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Savings progress</h2>
          <div className="space-y-4">
            {(data?.goals || []).slice(0, 4).map((g) => (
              <div key={g.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{g.name}</span>
                  <span>{Math.round(g.progress)}%</span>
                </div>
                <ProgressBar value={g.progress} status={g.progress >= 100 ? 'exceeded' : 'normal'} />
              </div>
            ))}
            {!data?.goals?.length ? <p className="text-sm text-slate-500">Create a savings goal to see progress.</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="mb-3 font-semibold">Budget usage</h2>
          <div className="space-y-3">
            {(data?.budgetUsage || []).map((b) => (
              <div key={b.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{b.category}</span>
                  <span>
                    {formatMoney(b.spent, currency)} / {formatMoney(b.budget, currency)}
                  </span>
                </div>
                <ProgressBar value={b.percent} status={b.status} />
              </div>
            ))}
            {!data?.budgetUsage?.length ? <p className="text-sm text-slate-500">No budgets this month.</p> : null}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Recent transactions</h2>
          <div className="space-y-3">
            {(data?.recentTransactions || []).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-xs text-slate-500">
                    {t.category} · {formatDate(t.date)}
                  </p>
                </div>
                <p className={t.type === 'INCOME' ? 'font-semibold text-emerald-600' : 'font-semibold text-slate-800'}>
                  {t.type === 'INCOME' ? '+' : '−'}
                  {formatMoney(t.amount, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Upcoming bills</h2>
          <div className="space-y-3">
            {(data?.upcomingBills || []).map((b) => (
              <div key={b.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-slate-500">
                    {b.status} · {formatDate(b.dueDate)}
                  </p>
                </div>
                <p className="font-semibold">{formatMoney(b.amount, currency)}</p>
              </div>
            ))}
            {!data?.upcomingBills?.length ? <p className="text-sm text-slate-500">No upcoming bills.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
