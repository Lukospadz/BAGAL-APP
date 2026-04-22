import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminRoute, PlayerRoute } from '@/components/auth/ProtectedRoute'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminShell } from '@/components/layout/AdminShell'

// Public pages
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { TournamentsPage } from '@/pages/TournamentsPage'
import { PlayersPage } from '@/pages/PlayersPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { LoginPage } from '@/pages/LoginPage'

// Admin pages
import { PlayersAdminPage } from '@/pages/admin/PlayersAdminPage'
import { SeasonsAdminPage } from '@/pages/admin/SeasonsAdminPage'
import { SeasonDetailAdminPage } from '@/pages/admin/SeasonDetailAdminPage'
import { TournamentFormPage } from '@/pages/admin/TournamentFormPage'
import { ScoreEntryPage } from '@/pages/admin/ScoreEntryPage'
import { CasualRoundsPage } from '@/pages/admin/CasualRoundsPage'
import { AccountsAdminPage } from '@/pages/admin/AccountsAdminPage'

// Player self-service pages
import { ProfilePage } from '@/pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route index element={<LeaderboardPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="players" element={<PlayersPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>

      <Route path="login" element={<LoginPage />} />

      {/* Player self-service (authenticated, any role) */}
      <Route element={<PlayerRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route path="admin" element={<AdminRoute />}>
        <Route element={<AdminShell />}>
          <Route index element={<Navigate to="seasons" replace />} />
          <Route path="players" element={<PlayersAdminPage />} />
          <Route path="accounts" element={<AccountsAdminPage />} />
          <Route path="seasons" element={<SeasonsAdminPage />} />
          <Route path="seasons/:seasonId" element={<SeasonDetailAdminPage />} />
          <Route path="seasons/:seasonId/tournaments/new" element={<TournamentFormPage />} />
          <Route path="seasons/:seasonId/tournaments/:tournamentId" element={<TournamentFormPage />} />
          <Route path="seasons/:seasonId/tournaments/:tournamentId/scores" element={<ScoreEntryPage />} />
          <Route path="seasons/:seasonId/casual-rounds" element={<CasualRoundsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
