import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  title: string
  onMenuClick: () => void
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-background px-6 py-3">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="truncate text-display-sm font-semibold text-foreground">{title}</h1>
    </header>
  )
}
