import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const tabs = [
  { to: '/',            label: 'Leaderboard', end: true },
  { to: '/tournaments', label: 'Tournaments',  end: false },
  { to: '/players',     label: 'Players',      end: false },
  { to: '/history',     label: 'History',      end: false },
]

export function PublicNav() {
  const { isPlayer, isAdmin, signOut } = useAuth()

  return (
    <>
      <nav className="bg-green-dark flex items-center px-2">
        {/* Main tabs */}
        <div className="flex flex-1">
          {tabs.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'font-sans text-[12px] tracking-[0.07em] uppercase px-3 py-[0.65rem]',
                  'border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'text-gold-light border-gold'
                    : 'text-cream/60 border-transparent hover:text-cream/90',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right side: user actions */}
        <div className="flex items-center gap-0.5 pl-2">
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                [
                  'font-sans text-[11px] tracking-[0.07em] uppercase px-3 py-[0.65rem]',
                  'border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'text-gold-light border-gold'
                    : 'text-amber-300/80 border-transparent hover:text-amber-200',
                ].join(' ')
              }
            >
              Admin
            </NavLink>
          )}
          {isPlayer ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  [
                    'font-sans text-[12px] tracking-[0.07em] uppercase px-3 py-[0.65rem]',
                    'border-b-2 -mb-px transition-colors',
                    isActive
                      ? 'text-gold-light border-gold'
                      : 'text-cream/60 border-transparent hover:text-cream/90',
                  ].join(' ')
                }
              >
                Profile
              </NavLink>
              <button
                onClick={() => void signOut()}
                className="font-sans text-[11px] text-cream/40 hover:text-cream/70 transition-colors px-2 py-[0.65rem] ml-1"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="font-sans text-[12px] tracking-[0.07em] uppercase px-3 py-[0.65rem] border-b-2 -mb-px border-transparent text-cream/60 hover:text-cream/90 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <div className="h-[3px] bg-green-mid" />
    </>
  )
}
