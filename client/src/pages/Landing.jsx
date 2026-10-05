import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Sparkles,
  Target,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const features = [
  { icon: BarChart3, title: 'Live dashboard', text: 'See balance, cash flow, budgets, and savings in one calm view.' },
  { icon: Sparkles, title: 'CareVoice AI', text: 'Ask questions about your real spending, bills, and goals — never generic advice.' },
  { icon: Target, title: 'Goals that stick', text: 'Track a laptop, rent deposit, or emergency fund with monthly targets.' },
  { icon: Shield, title: 'Built for irregular income', text: 'Freelance, stipend, or part-time pay — plan around variable months.' },
];

const steps = [
  { n: '01', t: 'Create your account', d: 'Set currency, income target, and a savings goal in minutes.' },
  { n: '02', t: 'Track money', d: 'Add transactions, import CSV statements, or scan receipts.' },
  { n: '03', t: 'Stay on budget', d: 'Category budgets warn you before you overspend.' },
  { n: '04', t: 'Ask CareVoice AI', d: 'Get insights grounded in your actual numbers.' },
];

const faqs = [
  { q: 'Is this professional financial advice?', a: 'No. CareVoice is an educational money manager. Scores and AI replies are not a substitute for a licensed advisor.' },
  { q: 'Is my data isolated?', a: 'Yes. Every transaction, budget, bill, and chat belongs to your user account and cannot be accessed by other users.' },
  { q: 'Do I need an OpenAI key?', a: 'The app runs without it. CareVoice AI and receipt extraction need OPENAI_API_KEY on the server only — never in the browser.' },
  { q: 'What is Demo Mode?', a: 'Try Demo loads a fictional account for Alex Sharma. It is separate from real registrations.' },
];

export default function Landing() {
  const { demo } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function tryDemo() {
    setBusy(true);
    setError('');
    try {
      await demo();
      navigate('/app');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Wallet size={18} />
          </span>
          CareVoice
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary !py-2">
            Get Started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              <Sparkles size={14} /> For students & young professionals
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Turn Irregular Income Into Stable Savings
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              CareVoice helps students and young professionals track money, control spending, build savings
              goals, and make smarter financial decisions with AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">
                Get Started <ArrowRight size={16} />
              </Link>
              <button type="button" className="btn-secondary" onClick={tryDemo} disabled={busy}>
                {busy ? 'Loading demo...' : 'View Demo'}
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-slate-500">This month</p>
            <p className="mt-1 text-3xl font-bold">₹13,500 saved</p>
            <p className="mt-1 text-sm text-emerald-600">Savings rate 30%</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {['Income ₹45,000', 'Expenses ₹31,500', 'Food budget 72%', 'Laptop goal 45.7%'].map((x) => (
                <div key={x} className="rounded-xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-700">
                  {x}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
              CareVoice AI: Reducing food delivery by ₹1,500 could help you hit your laptop goal sooner.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Why CareVoice?</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Spreadsheets break when income is uneven. CareVoice combines tracking, budgets, bills, and an AI
            assistant that reads your actual ledger.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-5">
                <f.icon className="text-brand-600" size={22} />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">How It Works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-100 p-5">
                <p className="text-sm font-bold text-brand-700">{s.n}</p>
                <h3 className="mt-2 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-3">
          <div className="card p-6">
            <Bot className="text-brand-600" />
            <h3 className="mt-3 text-lg font-bold">AI-powered insights</h3>
            <p className="mt-2 text-sm text-slate-600">
              CareVoice AI uses your transactions, budgets, bills, and goals. It will not invent numbers if history is thin.
            </p>
          </div>
          <div className="card p-6">
            <Target className="text-brand-600" />
            <h3 className="mt-3 text-lg font-bold">Savings goals</h3>
            <p className="mt-2 text-sm text-slate-600">
              Name a goal, set a date, add or withdraw money, and see required monthly saving automatically.
            </p>
          </div>
          <div className="card p-6">
            <BarChart3 className="text-brand-600" />
            <h3 className="mt-3 text-lg font-bold">Expense analytics</h3>
            <p className="mt-2 text-sm text-slate-600">
              Daily, weekly, and monthly charts with category breakdowns and spending predictions from real history.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Testimonials</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Priya, design intern', 'I finally know where my stipend goes before rent week hits.'],
              ['Rahul, freelance writer', 'The demo showed me budgets plus AI questions against real categories.'],
              ['Meera, MBA student', 'CSV import saved me from typing three months of UPI history.'],
            ].map(([name, quote]) => (
              <blockquote key={name} className="card p-5 text-sm text-slate-600">
                “{quote}”
                <footer className="mt-3 font-semibold text-slate-900">{name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="card p-4">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Start planning the next irregular month</h2>
          <p className="mt-2 text-slate-600">Create a free account or explore the fictional Alex Sharma demo.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
            <button type="button" className="btn-secondary" onClick={tryDemo} disabled={busy}>
              Try Demo
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CareVoice. Educational use only.</p>
          <p className="flex items-center gap-2">
            <CheckCircle2 size={16} /> JWT auth · PostgreSQL · Server-side AI
          </p>
        </div>
      </footer>
    </div>
  );
}

