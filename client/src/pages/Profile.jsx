import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/ui';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    monthlyIncomeTarget: user?.monthlyIncomeTarget || '',
    currency: user?.currency || 'INR',
    financialGoal: user?.financialGoal || '',
    monthlySavingsTarget: user?.monthlySavingsTarget || '',
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await api.put('/users/me', form);
      setUser(res.data.data);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-sm text-slate-500">Email cannot be changed here. Default currency is INR.</p>
      <form className="card space-y-3 p-5" onSubmit={onSubmit}>
        <ErrorBanner message={error} />
        {saved ? <p className="text-sm text-emerald-700">Profile saved.</p> : null}
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-slate-50" value={user?.email || ''} disabled />
        </div>
        <div>
          <label className="label">Monthly income target</label>
          <input className="input" type="number" value={form.monthlyIncomeTarget} onChange={(e) => setForm({ ...form, monthlyIncomeTarget: e.target.value })} />
        </div>
        <div>
          <label className="label">Monthly savings target</label>
          <input className="input" type="number" value={form.monthlySavingsTarget} onChange={(e) => setForm({ ...form, monthlySavingsTarget: e.target.value })} />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED</option>
          </select>
        </div>
        <div>
          <label className="label">Financial goal</label>
          <textarea className="input" rows="3" value={form.financialGoal} onChange={(e) => setForm({ ...form, financialGoal: e.target.value })} />
        </div>
        {user?.isDemo ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You are on the fictional Alex Sharma demo account. Demo data is reset each time you click Try Demo.
          </p>
        ) : null}
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
