import { ClipboardCheck } from 'lucide-react'

export default function Reviews() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-display font-semibold text-foreground">Reviews</h2>
      <p className="mt-2 text-body text-muted-foreground">Scheduled portfolio reviews and alerts.</p>
    </div>
  )
}
