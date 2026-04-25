import { ReactNode } from 'react'

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
      <h2 className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-green-mid/70 whitespace-nowrap">
        {children}
      </h2>
      <div className="flex-1 h-px bg-green-pale/80" />
    </div>
  )
}
