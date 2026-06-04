import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useSidebar } from '@/hooks/useSidebar'
import { seedGlossary } from '@/stores/seed-glossary'
import { db } from '@/stores/db'
import { ToastProvider } from '@/components/ui/toast'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/profiling': 'Profiling',
  '/goals': 'Goals',
  '/universe-browser': 'Universe Browser',
  '/scorecard': 'Scorecard',
  '/portfolio': 'Portfolio',
  '/reviews': 'Reviews',
  '/journal': 'Journal',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/goals/')) return 'Goal Detail'
  if (pathname.startsWith('/scorecard/')) return 'Fund Detail'
  return 'Investor Adviser'
}

export function AppShell() {
  const { isOpen, isCollapsed, toggle, close } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const title = getPageTitle(location.pathname)

  useEffect(() => { seedGlossary().catch(console.error) }, [])

  useEffect(() => {
    db.riskProfiles.count().then(count => {
      if (count === 0 && location.pathname !== '/profiling') {
        navigate({ to: '/profiling', replace: true })
      }
    }).catch(console.error)
  }, [location.pathname, navigate])

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar isCollapsed={isCollapsed} isOpen={isOpen} onClose={close} />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar title={title} onMenuClick={toggle} />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
