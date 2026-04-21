import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function AdminRoute() {
  const { loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-green-dark flex items-center justify-center">
        <p className="text-cream font-serif text-lg">Loading…</p>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function PlayerRoute() {
  const { loading, isPlayer } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-green-dark flex items-center justify-center">
        <p className="text-cream font-serif text-lg">Loading…</p>
      </div>
    )
  }

  if (!isPlayer) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
