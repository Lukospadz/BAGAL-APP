interface StarRatingProps {
  value: number
  max?: number
  onChange?: (value: number) => void
  symbol?: string
}

export function StarRating({ value, max = 5, onChange, symbol = '★' }: StarRatingProps) {
  const interactive = !!onChange

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={[
            'text-xl leading-none transition-colors',
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default',
            star <= value ? 'text-gold' : 'text-green-pale',
          ].join(' ')}
          aria-label={`${star} ${symbol}`}
        >
          {symbol}
        </button>
      ))}
    </div>
  )
}
