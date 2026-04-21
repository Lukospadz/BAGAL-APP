interface EmptyStateProps {
  message: string
  hint?: string
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <p className="font-serif italic text-green-mid text-sm">{message}</p>
      {hint && (
        <p className="font-sans text-xs text-green-mid/60 mt-1">{hint}</p>
      )}
    </div>
  )
}
