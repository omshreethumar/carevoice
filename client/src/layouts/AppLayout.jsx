import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Receipt,
  BarChart3,
  Sparkles,
  User,
  Settings,
  Wallet,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classNames } from '../utils/format';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/app/goals', label: 'Goals', icon: Target },
  { to: '/app/bills', label: 'Bills', icon: Receipt },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/ai', label: 'AI Assistant', icon: Sparkles },
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const mobile = NAV.filter((n) =>
    ['/app', '/app/transactions', '/app/budgets', '/app/ai', '/app/settings'].includes(n.to)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-100 bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">CareVoice</p>
            <p className="text-xs text-slate-500">AI financial assistant</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <button
            type="button"
            className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 font-bold">
            <Wallet className="text-brand-600" size={20} /> CareVoice
          </div>
          <button
            type="button"
            className="text-sm text-slate-500"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Sign out
          </button>
        </header>
        <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white px-2 py-2 lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobile.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                classNames(
                  'flex flex-col items-center gap-1 rounded-xl py-2 text-[11px]',
                  isActive ? 'text-brand-700' : 'text-slate-500'
                )
              }
            >
              <item.icon size={18} />
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
