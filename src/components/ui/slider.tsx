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
  const trackRef = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef<'min' | 'max' | null>(null)

  const clamp = React.useCallback(
    (v: number) => Math.max(min, Math.min(max, Math.round(v / step) * step)),
    [min, max, step],
  )

  const getValueFromPosition = React.useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return min
      const percent = (clientX - rect.left) / rect.width
      return clamp(min + percent * (max - min))
    },
    [min, max, clamp],
  )

  const handlePointerDown = React.useCallback(
    (thumb: 'min' | 'max') => (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragging.current = thumb
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [],
  )

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      const v = getValueFromPosition(e.clientX)
      if (dragging.current === 'min') {
        onValueChange([Math.min(v, value[1]), value[1]])
      } else {
        onValueChange([value[0], Math.max(v, value[0])])
      }
    },
    [getValueFromPosition, onValueChange, value],
  )

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      dragging.current = null
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    },
    [],
  )

  const range = max - min || 1
  const leftPercent = ((value[0] - min) / range) * 100
  const rightPercent = ((value[1] - min) / range) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div
        ref={trackRef}
        className="relative h-2 w-full cursor-pointer touch-none select-none rounded-full bg-muted"
        onClick={e => {
          const v = getValueFromPosition(e.clientX)
          const distMin = Math.abs(v - value[0])
          const distMax = Math.abs(v - value[1])
          if (distMin <= distMax) {
            onValueChange([Math.min(v, value[1]), value[1]])
          } else {
            onValueChange([value[0], Math.max(v, value[0])])
          }
        }}
      >
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
        />
        <div
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value[0]}
          aria-label="Minimum value"
          tabIndex={0}
          className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-primary/50 bg-background shadow transition-colors hover:bg-accent active:cursor-grabbing"
          style={{ left: `${leftPercent}%` }}
          onPointerDown={handlePointerDown('min')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              onValueChange([clamp(value[0] - step), value[1]])
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              onValueChange([clamp(value[0] + step), value[1]])
            }
          }}
        />
        <div
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          aria-label="Maximum value"
          tabIndex={0}
          className="absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-primary/50 bg-background shadow transition-colors hover:bg-accent active:cursor-grabbing"
          style={{ left: `${rightPercent}%` }}
          onPointerDown={handlePointerDown('max')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              onValueChange([value[0], clamp(value[1] - step)])
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              onValueChange([value[0], clamp(value[1] + step)])
            }
          }}
        />
      </div>
      <div className="flex items-center justify-between text-small text-muted-foreground">
        <span>{formatLabel ? formatLabel(value[0]) : value[0]}</span>
        <span>{formatLabel ? formatLabel(value[1]) : value[1]}</span>
      </div>
    </div>
  )
}
