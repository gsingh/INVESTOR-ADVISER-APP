import { LayoutDashboard } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <LayoutDashboard className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-display font-semibold text-foreground">Dashboard</h2>
      <p className="mt-2 text-body text-muted-foreground">Your portfolio at a glance.</p>
    </div>
  )
}
