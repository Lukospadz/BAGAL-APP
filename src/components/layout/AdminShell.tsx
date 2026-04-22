import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
      <line x1="5" y1="2" x2="5" y2="18" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="5,2 15,6 5,10" fill="#c9a84c" />
    </svg>
  )
}

const navItems = [
  { to: '/admin/seasons', label: 'Seasons & Tournaments' },
  { to: '/admin/players', label: 'Players' },
  { to: '/admin/accounts', label: 'Accounts' },
]

export function AdminShell() {
  const { signOut, user } = useAuth()

  return (
    <div className="min-h-screen bg-green-faint">
      {/* Top bar */}
      <header className="bg-green-dark text-cream px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 mr-auto">
          <FlagIcon />
          <span className="font-serif text-base">BAGAL</span>
          <span className="font-sans text-[11px] tracking-widest uppercase text-cream/50 ml-1">
            Admin
          </span>
        </Link>

        <span className="font-sans text-xs text-cream/50 hidden sm:block">
          {user?.email}
        </span>

        <button
          onClick={() => void signOut()}
          className="font-sans text-xs text-cream/70 hover:text-cream transition-colors"
        >
          Sign out
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Sub-nav */}
        <nav className="flex gap-1 mb-6 bg-white border border-green-pale rounded-lg p-1 w-fit">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'font-sans text-sm px-4 py-1.5 rounded-md transition-colors',
                  isActive
                    ? 'bg-green-dark text-cream'
                    : 'text-green-dark hover:bg-green-faint',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </div>
  )
}
