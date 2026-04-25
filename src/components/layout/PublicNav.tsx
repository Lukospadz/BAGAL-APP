import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',            label: 'Leaderboard', end: true },
  { to: '/tournaments', label: 'Tournaments',  end: false },
  { to: '/players',     label: 'Club',         end: false },
  { to: '/props',       label: 'Props',        end: false },
]

export function PublicNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#1A3A2B',
        borderTop: '1px solid rgba(168,130,42,0.25)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-[720px] mx-auto flex">
        {tabs.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center py-3.5 font-sans text-[10px] font-bold tracking-[0.18em] uppercase transition-colors border-t-2',
                isActive
                  ? 'text-gold border-gold'
                  : 'text-cream/45 hover:text-cream/75 border-transparent',
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
