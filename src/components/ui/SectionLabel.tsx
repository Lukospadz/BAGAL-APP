import { ReactNode } from 'react'

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="flex-1 h-px bg-green-pale" />
      <span className="font-sans text-[11px] font-medium tracking-[0.1em] uppercase text-green-mid whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-green-pale" />
    </div>
  )
}
