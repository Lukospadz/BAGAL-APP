import { ReactNode } from 'react'

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[22px] font-semibold text-green-dark tracking-tight mb-3 mt-5 first:mt-0">
      {children}
    </h2>
  )
}
