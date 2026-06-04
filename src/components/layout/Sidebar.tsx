import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard, UserCheck, Target, Search, BarChart3,
  PieChart, ClipboardCheck, BookOpen, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Profiling', path: '/profiling', icon: <UserCheck className="h-4 w-4" /> },
  { label: 'Goals', path: '/goals', icon: <Target className="h-4 w-4" /> },
  { label: 'Universe Browser', path: '/universe-browser', icon: <Search className="h-4 w-4" /> },
  { label: 'Scorecard', path: '/scorecard', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Portfolio', path: '/portfolio', icon: <PieChart className="h-4 w-4" /> },
  { label: 'Reviews', path: '/reviews', icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'Journal', path: '/journal', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Settings', path: '/settings', icon: <Settings className="h-4 w-4" /> },
]

interface SidebarLinkProps {
  item: NavItem
  collapsed: boolean
  onClick?: () => void
}

function SidebarLink({ item, collapsed, onClick }: SidebarLinkProps) {
  return (
    <Link
      to={item.path}
      activeProps={{ className: 'bg-sidebar-active text-white font-medium' }}
      className={cn(
        'flex items-center gap-3 rounded-md text-sm text-white/80 transition-colors hover:bg-sidebar-hover hover:text-white',
        collapsed ? 'justify-center px-2 py-3' : 'px-4 py-2',
      )}
      onClick={onClick}
    >
      {item.icon}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

interface SidebarProps {
  isCollapsed: boolean
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isCollapsed, isOpen, onClose }: SidebarProps) {
  const sidebarContent = (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {navItems.map((item) => (
        <SidebarLink key={item.path} item={item} collapsed={isCollapsed} />
      ))}
    </nav>
  )

  return (
    <TooltipProvider delayDuration={200}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-sidebar-bg text-white transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-[260px]',
        )}
      >
        <div className={cn('flex items-center border-b border-white/10 px-4 py-4', isCollapsed && 'justify-center')}>
          <span className={cn('font-semibold', isCollapsed ? 'text-sm' : 'text-label')}>
            {isCollapsed ? 'IA' : 'Investor Adviser'}
          </span>
        </div>
        {isCollapsed ? (
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <SidebarLink item={item} collapsed />
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>
        ) : (
          sidebarContent
        )}
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="flex flex-col bg-sidebar-bg p-0 text-white">
          <SheetHeader className="border-b border-white/10 px-4 py-4">
            <SheetTitle className="text-left text-label text-white">Investor Adviser</SheetTitle>
          </SheetHeader>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => (
              <SidebarLink key={item.path} item={item} collapsed={false} onClick={onClose} />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
