import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';
import { ErrorBanner, Spinner } from '../components/ui';

const PERIODS = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '3m', label: '3 months' },
  { id: '6m', label: '6 months' },
  { id: '1y', label: '1 year' },
];
const COLORS = ['#0d9488', '#0369a1', '#d97706', '#7c3aed', '#dc2626', '#059669'];

export default function Analytics() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [pred, setPred] = useState(null);
  const [health, setHealth] = useState(null);
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [a, p, h, i] = await Promise.all([
        api.get('/analytics', { params: { period } }),
        api.get('/predictions'),
        api.get('/analytics/health'),
        api.get('/insights'),
      ]);
      setData(a.data.data);
      setPred(p.data.data);
      setHealth(h.data.data);
      setInsights(i.data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (loading && !data) return <Spinner label="Loading analytics..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-slate-500">Built from your PostgreSQL transactions — not sample charts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              className={period === p.id ? 'btn-primary !py-2' : 'btn-secondary !py-2'}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ErrorBanner message={error} onRetry={load} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Income</p>
          <p className="text-xl font-bold">{formatMoney(data?.income, currency)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Expenses</p>
          <p className="text-xl font-bold">{formatMoney(data?.expenses, currency)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Avg daily spend</p>
          <p className="text-xl font-bold">{formatMoney(data?.averageDailySpending, currency)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Savings rate</p>
          <p className="text-xl font-bold">{Math.round(data?.savingsRate || 0)}%</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Daily spending</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
                <Line type="monotone" dataKey="expenses" stroke="#0d9488" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Weekly spending</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" hide />
                <YAxis />
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
                <Bar dataKey="expenses" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Income & expense trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly || data?.weekly || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={data?.monthly?.length ? 'month' : 'week'} />
                <YAxis />
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
                <Area dataKey="income" stroke="#059669" fill="#d1fae5" />
                <Area dataKey="expenses" stroke="#e11d48" fill="#ffe4e6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Category spending</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.categorySpending || []} dataKey="amount" nameKey="category" innerRadius={48} outerRadius={80}>
                  {(data?.categorySpending || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold">Spending prediction</h2>
          {!pred?.enoughData ? (
            <p className="mt-3 text-sm text-slate-600">
              {pred?.message || 'Not enough transaction history. Add more transactions to generate a prediction.'}
            </p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <p>Expected monthly expenses: {formatMoney(pred.expectedMonthlyExpenses, currency)}</p>
              <p>Expected savings: {formatMoney(pred.expectedSavings, currency)}</p>
              <p className="text-xs text-slate-400">Method: {pred.method} · {pred.monthsUsed} months of history</p>
              <div className="pt-2">
                <p className="font-medium">High-risk categories</p>
                {(pred.highRiskCategories || []).length === 0 ? (
                  <p className="text-slate-500">None flagged from current budgets.</p>
                ) : (
                  pred.highRiskCategories.map((c) => (
                    <p key={c.category}>
                      {c.category}: {c.reason}
                    </p>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">Financial health score</h2>
          <p className="mt-2 text-4xl font-bold">{health?.score ?? '—'}/100</p>
          <p className="text-xs text-slate-400">Educational only — not professional financial advice.</p>
          <div className="mt-4 grid gap-2 text-sm">
            <p><span className="font-medium text-emerald-700">Good:</span> {(health?.reasons?.good || []).join(', ') || '—'}</p>
            <p><span className="font-medium text-amber-700">Needs attention:</span> {(health?.reasons?.attention || []).join(', ') || '—'}</p>
            <p><span className="font-medium text-rose-700">Risk:</span> {(health?.reasons?.risk || []).join(', ') || '—'}</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Generated insights</h2>
        <div className="space-y-2">
          {insights.map((n) => (
            <p key={n.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {n.message}
            </p>
          ))}
          {!insights.length ? <p className="text-sm text-slate-500">Add more activity to generate insights.</p> : null}
        </div>
      </div>
    </div>
  );
}
