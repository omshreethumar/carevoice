import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2 font-bold">
          <Wallet className="text-brand-600" /> CareVoice
        </div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Default currency is INR. You can change it later.</p>
        <div className="mt-6 space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Get started'}
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="text-brand-700" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

