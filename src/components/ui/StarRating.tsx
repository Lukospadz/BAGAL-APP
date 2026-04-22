interface StarRatingProps {
  value: number
  max?: number
  onChange?: (value: number) => void
}

export function StarRating({ value, max = 5, onChange }: StarRatingProps) {
  const interactive = !!onChange

  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={[
            'text-xl leading-none transition-all select-none',
            interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default',
            star <= value ? 'text-gold' : 'text-green-pale',
          ].join(' ')}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
      {interactive && value > 0 && (
        <span className="font-sans text-xs text-green-mid ml-1">{value}/5</span>
      )}
    </div>
  )
}
