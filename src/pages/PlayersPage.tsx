import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Card } from '@/components/ui/Card'
import { usePlayers } from '@/hooks/usePlayers'

export function PlayersPage() {
  const { data: players, isLoading } = usePlayers()

  return (
    <div className="p-4 pt-2">
      <SectionLabel>The field</SectionLabel>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-green-pale/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !players?.length ? (
        <EmptyState
          message="No players yet"
          hint="An admin will set up the player profiles."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {players.map((p) => (
            <Card key={p.id} className="p-4 text-center">
              <div className="flex justify-center mb-3">
                <PlayerAvatar
                  name={p.name}
                  initials={p.initials}
                  color={p.color}
                  avatarUrl={p.avatar_url}
                  size="lg"
                />
              </div>
              <p className="font-serif text-base text-green-dark">{p.name}</p>
              {p.home_course && (
                <p className="font-sans text-xs text-green-mid mt-0.5">{p.home_course}</p>
              )}
              {p.bio && (
                <p className="font-sans text-xs text-green-mid/70 mt-1 line-clamp-2">{p.bio}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
