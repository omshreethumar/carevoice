import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';
import { ErrorBanner, ProgressBar } from '../components/ui';

export default function Settings() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [fund, setFund] = useState({ monthlyEssential: 25000, targetMonths: 6, currentAmount: 0 });
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/users/me/emergency-fund')
      .then((res) => {
        setLoaded(res.data.data);
        setFund({
          monthlyEssential: res.data.data.monthlyEssential || 25000,
          targetMonths: res.data.data.targetMonths || 6,
          currentAmount: res.data.data.currentAmount || 0,
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      const res = await api.put('/users/me/emergency-fund', fund);
      setLoaded(res.data.data);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  const recommended = Number(fund.monthlyEssential || 0) * Number(fund.targetMonths || 0);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>
      <ErrorBanner message={error} />
      <div className="card p-5">
        <h2 className="font-semibold">Emergency fund tracker</h2>
        <p className="mt-1 text-sm text-slate-500">
          Recommended fund = monthly essential expenses × months. This is a planning tool, not advice.
        </p>
        <form className="mt-4 space-y-3" onSubmit={save}>
          <div>
            <label className="label">Monthly essential expenses</label>
            <input className="input" type="number" value={fund.monthlyEssential} onChange={(e) => setFund({ ...fund, monthlyEssential: e.target.value })} />
          </div>
          <div>
            <label className="label">Target months</label>
            <input className="input" type="number" min="1" max="24" value={fund.targetMonths} onChange={(e) => setFund({ ...fund, targetMonths: e.target.value })} />
          </div>
          <div>
            <label className="label">Current emergency fund</label>
            <input className="input" type="number" value={fund.currentAmount} onChange={(e) => setFund({ ...fund, currentAmount: e.target.value })} />
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p>Recommended emergency fund: {formatMoney(recommended, currency)}</p>
            <p>Current: {formatMoney(fund.currentAmount, currency)}</p>
            <div className="mt-2">
              <ProgressBar
                value={recommended ? (Number(fund.currentAmount) / recommended) * 100 : 0}
                status="normal"
              />
            </div>
          </div>
          {saved ? <p className="text-sm text-emerald-700">Emergency fund saved.</p> : null}
          <button className="btn-primary">Save tracker</button>
        </form>
      </div>
      <div className="card space-y-2 p-5 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">More</h2>
        <p>
          Update name, currency, and savings targets on your <Link className="text-brand-700" to="/app/profile">profile</Link>.
        </p>
        <p>Receipt scanning and Pocket AI require OPENAI_API_KEY on the server, never in frontend code.</p>
        {loaded?.id ? <p className="text-xs text-slate-400">Tracker id {loaded.id}</p> : null}
      </div>
    </div>
  );
}
