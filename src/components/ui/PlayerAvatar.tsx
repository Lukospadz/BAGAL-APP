interface PlayerAvatarProps {
  name: string
  initials: string
  color: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  frame?: string | null  // frame key e.g. 'gold', 'fire'
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

function frameClass(frame: string | null | undefined): string {
  if (!frame) return ''
  return `avatar-frame-${frame}`
}

export function PlayerAvatar({ name, initials, color, avatarUrl, size = 'md', frame }: PlayerAvatarProps) {
  const fc = frameClass(frame)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-white/25 ${fc}`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-sans font-bold border-2 border-white/25 ${fc}`}
      style={{ backgroundColor: color, color: '#fff' }}
    >
      {initials}
    </div>
  )
}
