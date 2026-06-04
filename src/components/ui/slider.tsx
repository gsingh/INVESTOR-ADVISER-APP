import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  formatLabel?: (value: number) => string
  className?: string
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  formatLabel,
  className,
}: SliderProps) {
  const range = max - min || 1
  const leftPercent = ((value[0] - min) / range) * 100
  const rightPercent = ((value[1] - min) / range) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative h-2 w-full rounded-full bg-muted">
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={e => {
            const v = Number(e.target.value)
            onValueChange([Math.min(v, value[1]), value[1]])
          }}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/50 [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:hover:bg-accent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/50 [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:hover:bg-accent"
          aria-label="Minimum value"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={e => {
            const v = Number(e.target.value)
            onValueChange([value[0], Math.max(v, value[0])])
          }}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/50 [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:hover:bg-accent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/50 [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:hover:bg-accent"
          aria-label="Maximum value"
        />
      </div>
      <div className="flex items-center justify-between text-small text-muted-foreground">
        <span>{formatLabel ? formatLabel(value[0]) : value[0]}</span>
        <span>{formatLabel ? formatLabel(value[1]) : value[1]}</span>
      </div>
    </div>
  )
}
