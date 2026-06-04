import { BookOpen } from 'lucide-react'

export default function Journal() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-display font-semibold text-foreground">Investment Journal</h2>
      <p className="mt-2 text-body text-muted-foreground">Document your investment decisions.</p>
    </div>
  )
}
