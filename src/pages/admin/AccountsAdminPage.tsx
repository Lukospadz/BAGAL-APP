import { useAdminProfiles, useLinkProfileToPlayer, useSetProfileRole } from '@/hooks/useAdminProfiles'
import { usePlayers } from '@/hooks/usePlayers'
import { Card } from '@/components/ui/Card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'

export function AccountsAdminPage() {
  const { data: profiles, isLoading } = useAdminProfiles()
  const { data: players } = usePlayers()
  const linkProfile = useLinkProfileToPlayer()
  const setRole = useSetProfileRole()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-green-pale/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const takenPlayerIds = new Set(
    profiles?.filter((p) => p.player_id).map((p) => p.player_id!) ?? []
  )

  return (
    <div>
      <h2 className="font-serif text-xl text-green-dark mb-2">Accounts</h2>
      <p className="font-sans text-xs text-green-mid mb-4">
        When someone signs in for the first time, an account is created here. Link it to one of
        the BAGAL players so their profile works.
      </p>

      <div className="space-y-2">
        {profiles?.map((profile) => {
          const linkedPlayer = players?.find((p) => p.id === profile.player_id)
          return (
            <Card key={profile.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-green-dark font-medium">{profile.email}</p>
                  <p className="font-sans text-xs text-green-mid">
                    {new Date(profile.created_at).toLocaleDateString()}
                    {' · '}
                    <span className={profile.role === 'admin' ? 'text-gold font-medium' : ''}>
                      {profile.role}
                    </span>
                  </p>
                </div>

                {linkedPlayer ? (
                  <div className="flex items-center gap-2">
                    <PlayerAvatar
                      name={linkedPlayer.name}
                      initials={linkedPlayer.initials}
                      color={linkedPlayer.color}
                      avatarUrl={linkedPlayer.avatar_url}
                      size="sm"
                    />
                    <span className="font-serif text-sm text-green-dark">{linkedPlayer.name}</span>
                    <button
                      onClick={() =>
                        linkProfile.mutateAsync({ profileId: profile.id, playerId: null })
                      }
                      disabled={linkProfile.isPending}
                      className="btn-ghost text-xs py-1 px-2"
                    >
                      Unlink
                    </button>
                  </div>
                ) : (
                  <select
                    className="field-select text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        linkProfile.mutateAsync({
                          profileId: profile.id,
                          playerId: e.target.value,
                        })
                      }
                    }}
                  >
                    <option value="" disabled>
                      Link to player…
                    </option>
                    {players?.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={takenPlayerIds.has(p.id)}
                      >
                        {p.name}
                        {takenPlayerIds.has(p.id) ? ' (already linked)' : ''}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() =>
                    setRole.mutateAsync({
                      profileId: profile.id,
                      role: profile.role === 'admin' ? 'player' : 'admin',
                    })
                  }
                  disabled={setRole.isPending}
                  className="btn-ghost text-xs py-1 px-2"
                >
                  {profile.role === 'admin' ? 'Remove admin' : 'Make admin'}
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {linkProfile.isError && (
        <p className="font-sans text-xs text-red-600 mt-2">{String(linkProfile.error)}</p>
      )}
    </div>
  )
}
