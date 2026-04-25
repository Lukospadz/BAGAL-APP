import { useState } from 'react'

interface Props {
  onConfirm: () => unknown
  isPending?: boolean
  children: React.ReactNode
  confirmLabel?: string
  className?: string
}

export function ConfirmButton({
  onConfirm,
  isPending,
  children,
  confirmLabel = 'Confirm',
  className = 'btn-danger text-xs py-1 px-3',
}: Props) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={() => setConfirming(false)}
          className="font-sans text-xs text-green-mid hover:text-green-dark px-2 py-1 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            await onConfirm()
            setConfirming(false)
          }}
          disabled={isPending}
          className="font-sans text-xs font-semibold bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : confirmLabel}
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={isPending}
      className={className}
    >
      {children}
    </button>
  )
}
