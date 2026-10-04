import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, formatMoney } from '../utils/format';
import { EmptyState, ErrorBanner, Modal, ProgressBar, Spinner } from '../components/ui';

const STATUS_COPY = {
  normal: 'Normal',
  warning: 'Warning',
  almost: 'Almost exceeded',
  exceeded: 'Exceeded',
};

export default function Budgets() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: 'Food', amount: '' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/budgets');
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
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.put(`/budgets/${editing.id}`, payload);
      else await api.post('/budgets', payload);
      setModal(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-slate-500">Monthly category limits with live spend from transactions.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setForm({ category: 'Food', amount: '' });
            setModal(true);
          }}
        >
          Add budget
        </button>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No budgets" subtitle="Create a Food or Transport budget to start." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{b.category}</h3>
                  <p className="text-xs text-slate-500">{STATUS_COPY[b.status] || b.status}</p>
                </div>
                <div className="text-right text-sm">
                  <button
                    className="text-brand-700"
                    onClick={() => {
                      setEditing(b);
                      setForm({ category: b.category, amount: b.amount });
                      setModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-3 text-rose-600"
                    onClick={async () => {
                      await api.delete(`/budgets/${b.id}`);
                      load();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Spent {formatMoney(b.spent, currency)} of {formatMoney(b.amount, currency)} · Remaining{' '}
                {formatMoney(b.remaining, currency)}
              </p>
              <div className="mt-3">
                <ProgressBar value={b.percent} status={b.status} />
                <p className="mt-1 text-right text-xs text-slate-500">{b.percent}% used</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} title={editing ? 'Edit budget' : 'New budget'} onClose={() => setModal(false)}>
        <form className="space-y-3" onSubmit={save}>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <input className="input" type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <button className="btn-primary w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
