import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ErrorBanner } from '../components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    token: params.get('token') || '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', form);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <div className="mt-6 space-y-4">
          <ErrorBanner message={error} />
          {done ? (
            <p className="text-sm text-emerald-700">
              Password updated. <Link to="/login">Sign in</Link>
            </p>
          ) : (
            <>
              <div>
                <label className="label">Reset token</label>
                <input className="input" required value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
              </div>
              <div>
                <label className="label">New password</label>
                <input className="input" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input className="input" type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
