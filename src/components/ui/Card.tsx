import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'tinted'
}

export function Card({ variant = 'default', className = '', ...props }: CardProps) {
  const base = 'rounded-lg border border-green-pale shadow-card'
  const variants = {
    default: 'bg-white',
    tinted:  'bg-green-faint',
  }
  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
