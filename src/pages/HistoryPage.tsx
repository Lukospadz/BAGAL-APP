import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'

export function HistoryPage() {
  return (
    <div className="p-4 pt-2">
      <SectionLabel>Results log</SectionLabel>
      <EmptyState
        message="No results yet"
        hint="History will appear here once tournament scores are entered."
      />
    </div>
  )
}
