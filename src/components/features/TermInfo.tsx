import { useLiveQuery } from 'dexie-react-hooks'
import { Info, HelpCircle } from 'lucide-react'
import { db, type GlossaryEntry } from '@/stores/db'
import { Button } from '@/components/ui/button'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'

interface TermInfoProps {
  slug: string
  inline?: boolean
}

function TermContent({ entry }: { entry: GlossaryEntry }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-body text-muted-foreground">{entry.definition}</p>
      </div>
      <div className="rounded-md bg-muted p-3">
        <p className="mb-1 text-small font-medium text-muted-foreground">Example</p>
        <p className="break-words text-mono text-sm">{entry.example}</p>
      </div>
      <div className="border-l-2 border-primary pl-3">
        <p className="text-small text-muted-foreground">
          <span className="font-medium">Why this matters: </span>
          {entry.whyMatters}
        </p>
      </div>
    </div>
  )
}

function TermInfoFallback({ inline }: { inline: boolean }) {
  if (inline) {
    return (
      <div className="mt-1 flex items-center gap-1 text-small text-muted-foreground">
        <HelpCircle className="h-3 w-3" />
        <span>Learn more about this term</span>
        <span className="ml-1 cursor-not-allowed text-xs opacity-50">(Suggest this term)</span>
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5" aria-label="Learn more about this term">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-72 break-words text-sm">
        <p className="text-muted-foreground">Learn more about this term</p>
        <p className="mt-1 cursor-not-allowed text-xs text-muted-foreground opacity-50">Suggest this term</p>
      </PopoverContent>
    </Popover>
  )
}

export function TermInfo({ slug, inline }: TermInfoProps) {
  const entry = useLiveQuery(
    () => db.glossary.where('slug').equals(slug).first().then(r => r ?? null),
    [slug],
  )

  if (entry === undefined) {
    return (
      <span className="inline-flex items-center gap-1">
        <Skeleton className="inline-block h-4 w-4 rounded-full" />
      </span>
    )
  }

  if (entry === null) {
    return <TermInfoFallback inline={inline ?? false} />
  }

  if (inline) {
    return (
      <details className="group">
        <summary className="inline-flex cursor-pointer items-center gap-1 text-small text-muted-foreground hover:text-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>What is this?</span>
        </summary>
        <div className="mt-2 border-l-2 border-primary pl-3">
          <div className="space-y-2">
            <TermContent entry={entry} />
          </div>
        </div>
      </details>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5" aria-label={`Learn about ${entry.term}`}>
          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-80 break-words">
        <div className="space-y-2">
          <h4 className="text-label font-semibold">{entry.term}</h4>
          <TermContent entry={entry} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
