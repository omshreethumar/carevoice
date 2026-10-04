import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, formatDate, formatMoney } from '../utils/format';
import { EmptyState, ErrorBanner, Modal, Spinner } from '../components/ui';

export default function Bills() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDate: '',
    category: 'Bills',
    recurring: true,
    frequency: 'MONTHLY',
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/bills');
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

  const groups = {
    OVERDUE: rows.filter((b) => b.status === 'OVERDUE'),
    UPCOMING: rows.filter((b) => b.status === 'UPCOMING'),
    PAID: rows.filter((b) => b.status === 'PAID'),
  };

  async function save(e) {
    e.preventDefault();
    try {
      await api.post('/bills', { ...form, amount: Number(form.amount) });
      setModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bills</h1>
          <p className="text-sm text-slate-500">Upcoming, overdue, and paid reminders.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          Add bill
        </button>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No bills" subtitle="Add rent, subscriptions, or utilities." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(groups).map(([status, list]) => (
            <div key={status} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{status}</h2>
              {list.map((b) => (
                <div key={b.id} className="card p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(b.dueDate)} · {b.recurring ? b.frequency : 'One-time'}
                      </p>
                    </div>
                    <p className="font-bold">{formatMoney(b.amount, currency)}</p>
                  </div>
                  <div className="mt-3 flex gap-2 text-sm">
                    {b.status !== 'PAID' ? (
                      <button className="text-emerald-700" onClick={() => api.put(`/bills/${b.id}`, { status: 'PAID' }).then(load)}>
                        Mark paid
                      </button>
                    ) : null}
                    <button className="text-rose-600" onClick={() => api.delete(`/bills/${b.id}`).then(load)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!list.length ? <p className="text-sm text-slate-400">None</p> : null}
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} title="New bill" onClose={() => setModal(false)}>
        <form className="space-y-3" onSubmit={save}>
          <input className="input" placeholder="Bill name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="number" placeholder="Amount" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className="input" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} />
            Recurring
          </label>
          {form.recurring ? (
            <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          ) : null}
          <button className="btn-primary w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
