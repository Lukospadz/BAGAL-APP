import { Outlet } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'
import { PublicNav } from './PublicNav'

export function PublicLayout() {
  return (
    <div className="max-w-[720px] mx-auto pb-20">
      <SiteHeader />
      <PublicNav />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
