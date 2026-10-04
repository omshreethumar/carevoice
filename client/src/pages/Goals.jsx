import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatMoney } from '../utils/format';
import { EmptyState, ErrorBanner, Modal, ProgressBar, Spinner } from '../components/ui';

export default function Goals() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [moneyModal, setMoneyModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'General',
  });
  const [money, setMoney] = useState({ action: 'add', amount: '' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/goals');
      setRows(res.data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      await api.post('/goals', { ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount || 0) });
      setModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function applyMoney(e) {
    e.preventDefault();
    try {
      await api.put(`/goals/${moneyModal.id}`, { action: money.action, amount: Number(money.amount) });
      setMoneyModal(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Savings goals</h1>
          <p className="text-sm text-slate-500">Track progress, required monthly saving, and expected completion.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          New goal
        </button>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No goals yet" subtitle="Try “New Laptop” with a target date." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((g) => (
            <div key={g.id} className="card p-5">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{g.name}</h3>
                  <p className="text-xs text-slate-500">{g.category}</p>
                </div>
                <button
                  className="text-sm text-rose-600"
                  onClick={async () => {
                    await api.delete(`/goals/${g.id}`);
                    load();
                  }}
                >
                  Delete
                </button>
              </div>
              <p className="mt-3 text-2xl font-bold">
                {formatMoney(g.currentAmount, currency)}
                <span className="text-sm font-medium text-slate-400"> / {formatMoney(g.targetAmount, currency)}</span>
              </p>
              <div className="mt-3">
                <ProgressBar value={g.progress} status={g.progress >= 90 ? 'warning' : 'normal'} />
                <p className="mt-1 text-xs text-slate-500">{g.progress}% · due {formatDate(g.targetDate)}</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Required monthly saving: {formatMoney(g.requiredMonthly, currency)}
              </p>
              <p className="text-sm text-slate-600">
                Expected completion: {g.expectedCompletion ? formatDate(g.expectedCompletion) : 'Add contributions to estimate'}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  className="btn-primary !py-2"
                  onClick={() => {
                    setMoney({ action: 'add', amount: '' });
                    setMoneyModal(g);
                  }}
                >
                  Add money
                </button>
                <button
                  className="btn-secondary !py-2"
                  onClick={() => {
                    setMoney({ action: 'withdraw', amount: '' });
                    setMoneyModal(g);
                  }}
                >
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} title="Create goal" onClose={() => setModal(false)}>
        <form className="space-y-3" onSubmit={save}>
          <input className="input" placeholder="Goal name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="input" type="number" placeholder="Target amount" required value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
          <input className="input" type="number" placeholder="Current amount" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
          <input className="input" type="date" required value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          <button className="btn-primary w-full">Create</button>
        </form>
      </Modal>
      <Modal open={Boolean(moneyModal)} title={money.action === 'add' ? 'Add money' : 'Withdraw'} onClose={() => setMoneyModal(null)}>
        <form className="space-y-3" onSubmit={applyMoney}>
          <input className="input" type="number" min="1" required value={money.amount} onChange={(e) => setMoney({ ...money, amount: e.target.value })} />
          <button className="btn-primary w-full">Confirm</button>
        </form>
      </Modal>
    </div>
  );
}
