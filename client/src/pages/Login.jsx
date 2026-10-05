import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/ui';

export default function Login() {
  const { login, demo } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2 font-bold">
          <Wallet className="text-brand-600" /> CareVoice
        </div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your finance workspace.</p>
        <div className="mt-6 space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })} />
            Remember me
          </label>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                await demo();
                navigate('/app');
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            Try Demo
          </button>
        </div>
        <div className="mt-4 flex justify-between text-sm">
          <Link className="text-brand-700" to="/forgot-password">
            Forgot password?
          </Link>
          <Link className="text-slate-600" to="/register">
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}

