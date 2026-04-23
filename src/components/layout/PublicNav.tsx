import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',            label: 'Leaderboard', end: true },
  { to: '/tournaments', label: 'Tournaments',  end: false },
  { to: '/players',     label: 'Players',      end: false },
  { to: '/history',     label: 'History',      end: false },
]

export function PublicNav() {
  return (
    <nav className="relative z-10 px-4 mb-4">
      <div className="bg-white/70 backdrop-blur-sm rounded-full border border-green-pale p-1 flex shadow-card">
        {tabs.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex-1 font-sans text-[12px] font-semibold tracking-wide text-center py-2 rounded-full transition-all',
                isActive
                  ? 'bg-green-dark text-cream shadow-pop'
                  : 'text-green-mid hover:text-green-dark',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
