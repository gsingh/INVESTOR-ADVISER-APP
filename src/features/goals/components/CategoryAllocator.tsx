import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Target, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TermInfo } from '@/components/features/TermInfo'
import { useCategoryMapping } from '../hooks/useCategoryMapping'
import { categoryTaxonomy, type AmfiSuperCategory } from '@/lib/category-taxonomy'

interface CategoryAllocatorProps {
  goalId: number
}

export function CategoryAllocator({ goalId }: CategoryAllocatorProps) {
  const navigate = useNavigate()
  const { recommendations, loading, error, saveOverride } = useCategoryMapping(goalId)
  const [changing, setChanging] = useState<Record<string, boolean>>({})

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-label">Recommended Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error === 'no_profile') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-label">Recommended Categories</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
          <p className="text-body text-muted-foreground">
            Complete your risk profile to get category recommendations.
          </p>
          <Button className="mt-4" onClick={() => navigate({ to: '/profiling' })}>
            Go to Risk Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-label">Recommended Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-label">Recommended Categories</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Target className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-body text-muted-foreground">
            Unable to determine category recommendations for this goal.
          </p>
        </CardContent>
      </Card>
    )
  }

  async function handleOverride(category: string, newCategory: string) {
    setChanging(prev => ({ ...prev, [category]: true }))
    try {
      await saveOverride(category, newCategory)
    } finally {
      setChanging(prev => ({ ...prev, [category]: false }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-label">Recommended Categories</CardTitle>
        <p className="text-small text-muted-foreground">
          Based on your risk profile and goal timeline
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map(r => (
          <div
            key={r.category}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-body font-medium text-foreground">
                {r.isOverride && r.originalCategory ? (
                  <>
                    <span className="line-through text-muted-foreground">{r.originalCategory}</span>
                    {' '}{r.category}
                  </>
                ) : (
                  r.category
                )}
              </span>
              <TermInfo slug={r.termSlug} />
              {r.isOverride && (
                <Badge variant="outline" className="rounded-full text-xs">
                  custom override
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-label text-muted-foreground">
                {(r.allocation * 100).toFixed(0)}%
              </span>
              <Select
                disabled={changing[r.category]}
                onValueChange={async v => {
                  try {
                    await handleOverride(r.category, v)
                  } catch {
                    // handled
                  }
                }}
              >
                <SelectTrigger className="h-8 w-32" aria-label="Change category">
                  <SelectValue placeholder="Change" />
                </SelectTrigger>
                <SelectContent>
                  {categoryTaxonomy.map(node => (
                    <SelectItem key={node.superCategory} value={node.superCategory}>
                      {node.superCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {changing[r.category] && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
