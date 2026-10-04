import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ErrorBanner } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.data.message);
      setDevToken(res.data.data.devResetToken || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">We will generate a reset token if the email exists.</p>
        <div className="mt-6 space-y-4">
          <ErrorBanner message={error} />
          {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          {devToken ? (
            <p className="text-xs text-slate-500">
              Development token:{' '}
              <Link className="text-brand-700 underline" to={`/reset-password?token=${devToken}`}>
                continue to reset
              </Link>
            </p>
          ) : null}
        </div>
        <Link to="/login" className="mt-4 inline-block text-sm text-slate-600">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
