import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useActiveSeason } from '@/hooks/useSeasons'

export function SiteHeader() {
  const { isPlayer, isAdmin, signOut } = useAuth()
  const { data: season } = useActiveSeason()

  return (
    <header className="relative z-10 px-4 pt-6 pb-4 border-b border-bone/60 mb-2">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-3 group">
          <span className="font-display text-[34px] font-bold tracking-[-0.03em] text-green-dark leading-none group-hover:text-green-mid transition-colors">
            BAGAL
          </span>
          {season && (
            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-gold/90 border border-gold/30 bg-gold-faint px-2.5 py-1 rounded-full">
              {season.name}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <Link to="/admin" className="btn-ghost text-xs py-1.5 px-3">
              Admin
            </Link>
          )}
          {isPlayer ? (
            <>
              <Link to="/profile" className="btn-ghost text-xs py-1.5 px-3">
                Profile
              </Link>
              <button
                onClick={() => void signOut()}
                className="font-sans text-xs text-green-mid/60 hover:text-green-dark px-2 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-xs py-1.5 px-4">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
