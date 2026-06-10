import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import type { InterplayWarning } from '@/lib/interplay'

const severityConfig = {
  info: { icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-800' },
  warning: { icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-800' },
  critical: { icon: AlertCircle, className: 'border-red-200 bg-red-50 text-red-800' },
}

interface InterplayWarningsProps {
  warnings: InterplayWarning[]
  fundName: string
}

export function InterplayWarnings({ warnings, fundName }: InterplayWarningsProps) {
  if (warnings.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-small font-medium text-muted-foreground">
        Parameter Interplay — {fundName}
      </h4>
      {warnings.map(w => {
        const cfg = severityConfig[w.severity]
        const Icon = cfg.icon
        return (
          <div
            key={w.ruleId}
            className={`flex items-start gap-2 rounded-md border p-2 text-small ${cfg.className}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{w.message}</span>
          </div>
        )
      })}
    </div>
  )
}

interface InterplayWarningsPanelProps {
  allWarnings: { fundName: string; warnings: InterplayWarning[] }[]
}

export function InterplayWarningsPanel({ allWarnings }: InterplayWarningsPanelProps) {
  const total = allWarnings.reduce((s, fw) => s + fw.warnings.length, 0)
  if (total === 0) return null

  const maxWarnings = 5
  const visible = allWarnings.flatMap(fw =>
    fw.warnings.slice(0, maxWarnings).map(w => ({ ...w, fundName: fw.fundName })),
  )

  if (visible.length === 0) return null

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-label font-semibold">Parameter Interplay Insights</h3>
      <div className="space-y-2">
        {visible.map(w => {
          const cfg = severityConfig[w.severity]
          const Icon = cfg.icon
          return (
            <div
              key={`${w.fundName}-${w.ruleId}`}
              className={`flex items-start gap-2 rounded-md border p-2 text-small ${cfg.className}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="font-medium">{w.fundName}: </span>
                <span>{w.message}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
