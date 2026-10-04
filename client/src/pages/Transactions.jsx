import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, PAYMENT_METHODS, formatDate, formatMoney } from '../utils/format';
import { EmptyState, ErrorBanner, Modal, Spinner } from '../components/ui';

const emptyForm = {
  amount: '',
  type: 'EXPENSE',
  category: 'Food',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'UPI',
  notes: '',
  autoCategory: true,
};

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', type: '', category: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [importPreview, setImportPreview] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load(page = filters.page) {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/transactions', {
        params: { ...filters, page, limit: 10, sort: 'date', order: 'desc' },
      });
      setRows(res.data.data);
      setMeta(res.data.meta);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.type, filters.category]);

  async function suggest(description) {
    if (!form.autoCategory || !description) return;
    try {
      const res = await api.post('/transactions/categorize', { description, type: form.type });
      setForm((f) => ({ ...f, category: res.data.data.category }));
    } catch {
      /* ignore */
    }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.put(`/transactions/${editing.id}`, payload);
      else await api.post('/transactions', payload);
      setModal(false);
      setEditing(null);
      setForm(emptyForm);
      load(meta.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    load(meta.page);
  }

  async function onCsv(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    setBusy(true);
    try {
      const res = await api.post('/transactions/import', data);
      setImportPreview(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function confirmImport() {
    setBusy(true);
    try {
      await api.post('/transactions/import/confirm', { batchId: importPreview.id });
      setImportPreview(null);
      load(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onReceipt(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    setBusy(true);
    try {
      const res = await api.post('/receipts/upload', data);
      setReceipt({
        ...res.data.data,
        notice: res.data.meta?.message,
        description: res.data.data.merchantName || '',
        amount: res.data.data.amount || '',
        category: res.data.data.suggestedCategory || 'Other',
        date: res.data.data.date ? String(res.data.data.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function saveReceipt(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/receipts/${receipt.id}/save`, receipt);
      setReceipt(null);
      load(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-slate-500">Search, filter, import CSV, or upload a receipt.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary cursor-pointer">
            Import CSV
            <input type="file" accept=".csv,text/csv" hidden onChange={onCsv} />
          </label>
          <label className="btn-secondary cursor-pointer">
            Scan receipt
            <input type="file" accept="image/*,application/pdf" hidden onChange={onReceipt} />
          </label>
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setModal(true);
            }}
          >
            Add transaction
          </button>
        </div>
      </div>
      <ErrorBanner message={error} onRetry={() => load(meta.page)} />
      <div className="grid gap-3 md:grid-cols-4">
        <input className="input" placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="input" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <select className="input" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <a className="btn-secondary" href="/sample-transactions.csv" download>
          Sample CSV
        </a>
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No transactions yet" subtitle="Add one manually or import a CSV statement." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="px-4 py-3">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.description}</p>
                    <p className="text-xs text-slate-500">{t.type}</p>
                  </td>
                  <td className="px-4 py-3">{t.category}</td>
                  <td className="px-4 py-3">{t.paymentMethod.replace('_', ' ')}</td>
                  <td className={`px-4 py-3 font-semibold ${t.type === 'INCOME' ? 'text-emerald-600' : ''}`}>
                    {t.type === 'INCOME' ? '+' : '−'}
                    {formatMoney(t.amount, currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="mr-3 text-brand-700"
                      onClick={() => {
                        setEditing(t);
                        setForm({
                          amount: t.amount,
                          type: t.type,
                          category: t.category,
                          description: t.description,
                          date: String(t.date).slice(0, 10),
                          paymentMethod: t.paymentMethod,
                          notes: t.notes || '',
                          autoCategory: false,
                        });
                        setModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="text-rose-600" onClick={() => remove(t.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <p className="text-slate-500">{meta.total} records</p>
            <div className="flex gap-2">
              <button className="btn-secondary !py-1.5" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>
                Previous
              </button>
              <button className="btn-secondary !py-1.5" disabled={meta.page >= meta.pages} onClick={() => load(meta.page + 1)}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} title={editing ? 'Edit transaction' : 'Add transaction'} onClose={() => setModal(false)}>
        <form className="space-y-3" onSubmit={save}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              required
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                suggest(e.target.value);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, autoCategory: false })}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment method</label>
              <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(importPreview)} title="CSV import preview" onClose={() => setImportPreview(null)}>
        {importPreview ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {importPreview.validRows} valid · {importPreview.invalidRows} invalid · duplicates are skipped
            </p>
            <div className="max-h-64 overflow-auto text-xs">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.rows?.map((r) => (
                    <tr key={r.id} className={r.valid ? '' : 'text-rose-600'}>
                      <td>{r.date}</td>
                      <td>{r.description}</td>
                      <td>{r.amount}</td>
                      <td>{r.valid ? 'OK' : (r.errors || []).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn-primary w-full" onClick={confirmImport} disabled={busy || !importPreview.validRows}>
              Import valid rows
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(receipt)} title="Receipt details" onClose={() => setReceipt(null)}>
        {receipt ? (
          <form className="space-y-3" onSubmit={saveReceipt}>
            {receipt.notice || receipt.errorMessage ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{receipt.notice || receipt.errorMessage}</p>
            ) : null}
            <div>
              <label className="label">Merchant / description</label>
              <input className="input" value={receipt.description} onChange={(e) => setReceipt({ ...receipt, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount</label>
                <input className="input" type="number" value={receipt.amount} onChange={(e) => setReceipt({ ...receipt, amount: e.target.value })} required />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={receipt.category} onChange={(e) => setReceipt({ ...receipt, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={receipt.date} onChange={(e) => setReceipt({ ...receipt, date: e.target.value })} />
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              Save as transaction
            </button>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
