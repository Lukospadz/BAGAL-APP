import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusPill } from '@/components/ui/StatusPill'
import { Card } from '@/components/ui/Card'
import { useActiveSeason } from '@/hooks/useSeasons'
import { useTournaments } from '@/hooks/useTournaments'

export function TournamentsPage() {
  const { data: season } = useActiveSeason()
  const { data: tournaments, isLoading } = useTournaments(season?.id)

  return (
    <div className="p-4 pt-2">
      <SectionLabel>
        {season ? `${season.name} events` : 'Season events'}
      </SectionLabel>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-green-pale/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !tournaments?.length ? (
        <EmptyState
          message="No tournaments scheduled yet"
          hint="An admin will add tournaments to this season."
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
                <div>
                  <p className="font-serif text-[15px] text-green-dark">{t.name}</p>
                  <p className="font-sans text-xs text-green-mid mt-0.5">
                    {t.status === 'completed' && t.course
                      ? `${t.course} · ${t.date ?? '—'}`
                      : 'Not yet played'}
                  </p>
                  <p className="font-sans text-xs text-green-mid mt-0.5">
                    1st: {t.points_1st}pts · 2nd: {t.points_2nd}pts · 3rd: {t.points_3rd}pts
                    {t.rounds > 1 && ` · ${t.rounds} rounds`}
                  </p>
                </div>
                <StatusPill status={t.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
