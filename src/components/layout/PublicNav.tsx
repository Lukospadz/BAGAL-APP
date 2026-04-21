import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',            label: 'Leaderboard', end: true },
  { to: '/tournaments', label: 'Tournaments',  end: false },
  { to: '/players',     label: 'Players',      end: false },
  { to: '/history',     label: 'History',      end: false },
]

export function PublicNav() {
  return (
    <>
      <nav className="bg-green-dark flex justify-center px-4">
        {tabs.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'font-sans text-[12px] tracking-[0.07em] uppercase px-4 py-[0.65rem]',
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
      </nav>
      <div className="h-[3px] bg-green-mid" />
    </>
  )
}
