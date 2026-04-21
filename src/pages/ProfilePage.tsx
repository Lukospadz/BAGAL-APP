import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'

export function ProfilePage() {
  return (
    <div className="max-w-lg mx-auto p-4">
      <SectionLabel>My profile</SectionLabel>
      <EmptyState
        message="Profile editing coming in M2"
        hint="You'll be able to update your photo, bio, bag, and log personal rounds here."
      />
    </div>
  )
}
