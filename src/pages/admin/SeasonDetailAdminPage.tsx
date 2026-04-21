import { Link, useParams } from 'react-router-dom'
import { useSeason } from '@/hooks/useSeasons'
import { useTournaments, useDeleteTournament } from '@/hooks/useTournaments'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/EmptyState'

export function SeasonDetailAdminPage() {
  const { seasonId } = useParams<{ seasonId: string }>()
  const { data: season, isLoading: seasonLoading } = useSeason(seasonId)
  const { data: tournaments, isLoading: tournsLoading } = useTournaments(seasonId)
  const deleteTournament = useDeleteTournament()

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? All scores for this tournament will also be deleted.`)) return
    await deleteTournament.mutateAsync({ id, seasonId: seasonId! })
  }

  if (seasonLoading) {
    return <div className="h-8 w-48 bg-green-pale/50 rounded animate-pulse" />
  }

  if (!season) {
    return <p className="font-sans text-sm text-red-600">Season not found.</p>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link to="/admin/seasons" className="font-sans text-xs text-green-mid hover:underline">
          ← Seasons
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl text-green-dark">{season.name}</h2>
          <StatusPill status={season.status} />
        </div>
        <Link
          to={`/admin/seasons/${seasonId}/tournaments/new`}
          className="btn-primary text-sm"
        >
          + Add tournament
        </Link>
      </div>

      {tournsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-green-pale/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !tournaments?.length ? (
        <EmptyState
          message="No tournaments yet"
          hint="Add the first tournament for this season."
        />
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <Card key={t.id} className="p-4 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: t.status === 'completed' ? '#2d6a35' : '#c8e0ca' }}
              />
              <div className="flex items-start justify-between gap-2 pl-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-base text-green-dark">{t.name}</p>
                    <StatusPill status={t.status} />
                  </div>
                  <p className="font-sans text-xs text-green-mid mt-0.5">
                    1st: {t.points_1st}pts · 2nd: {t.points_2nd}pts · 3rd: {t.points_3rd}pts
                    {t.rounds > 1 ? ` · ${t.rounds} rounds` : ''}
                    {` · ${t.holes} holes`}
                  </p>
                  {t.date && (
                    <p className="font-sans text-xs text-green-mid">{t.course ?? '—'} · {t.date}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    to={`/admin/seasons/${seasonId}/tournaments/${t.id}`}
                    className="btn-ghost text-xs py-1 px-3"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    disabled={deleteTournament.isPending}
                    className="btn-danger text-xs py-1 px-3"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
