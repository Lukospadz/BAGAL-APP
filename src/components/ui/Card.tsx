import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'tinted'
}

export function Card({ variant = 'default', className = '', ...props }: CardProps) {
  const base = 'rounded-2xl border border-green-pale/70 shadow-card backdrop-blur-[2px]'
  const variants = {
    default: 'bg-white/95',
    tinted:  'bg-green-faint/85',
  }
  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
