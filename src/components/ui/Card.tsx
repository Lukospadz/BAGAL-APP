import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'tinted' | 'dark'
}

export function Card({ variant = 'default', className = '', ...props }: CardProps) {
  const base = 'rounded-xl border shadow-card'
  const variants = {
    default: 'bg-white border-bone',
    tinted:  'bg-cream/80 border-bone',
    dark:    'bg-green-dark border-green-mid/20',
  }
  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
