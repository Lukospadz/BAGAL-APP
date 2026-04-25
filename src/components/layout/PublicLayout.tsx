import { Outlet } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'
import { PublicNav } from './PublicNav'

export function PublicLayout() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-[720px] mx-auto pb-28">
        <SiteHeader />
        <main>
          <Outlet />
        </main>
      </div>
      <PublicNav />
    </div>
  )
}
