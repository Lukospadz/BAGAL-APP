import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useActiveSeason } from '@/hooks/useSeasons'

export function SiteHeader() {
  const { isPlayer, isAdmin, signOut } = useAuth()
  const { data: season } = useActiveSeason()

  return (
    <header className="relative z-10 px-4 pt-5 pb-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2 group">
          <span className="font-display text-[30px] font-bold tracking-tight text-green-dark leading-none group-hover:text-green-mid transition-colors">
            BAGAL
          </span>
          {season && (
            <span className="chip-coral">
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
              <button onClick={() => void signOut()} className="font-sans text-xs text-green-mid/70 hover:text-green-dark px-2">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-xs py-1.5 px-3">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
