import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { useActiveSeason } from '@/hooks/useSeasons'

export function LeaderboardPage() {
  const { data: season, isLoading } = useActiveSeason()

  return (
    <div className="p-4 pt-2">
      <SectionLabel>Season standings</SectionLabel>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-green-dark/10 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !season ? (
        <EmptyState
          message="No active season yet"
          hint="An admin will set up Season 4 shortly."
        />
      ) : (
        <EmptyState
          message="Standings loading in M2"
          hint="Score entry and points calculation come next milestone."
        />
      )}

      <SectionLabel>Green jacket hall of fame</SectionLabel>
      <EmptyState
        message="Hall of fame populates once a season is completed"
        hint="Past champions will be crowned here."
      />

      <SectionLabel>Casual round bonuses</SectionLabel>
      <EmptyState
        message="No casual round bonuses yet this season"
      />
    </div>
  )
}
