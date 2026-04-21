type Status = 'upcoming' | 'completed' | 'active'

const styles: Record<Status, string> = {
  upcoming:  'bg-gold-faint text-yellow-800 border border-gold/40',
  completed: 'bg-green-pale text-green-dark border border-green-light/30',
  active:    'bg-green-pale text-green-dark border border-green-light/30',
}

const labels: Record<Status, string> = {
  upcoming:  'Upcoming',
  completed: 'Done',
  active:    'Active',
}

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`font-sans text-[10px] tracking-[0.03em] px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
