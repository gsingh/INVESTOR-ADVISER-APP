import { useState, useEffect, useCallback } from 'react'

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const md = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const lg = window.matchMedia('(min-width: 1024px)')

    const update = () => {
      if (lg.matches) setIsCollapsed(false)
      else if (md.matches) setIsCollapsed(true)
    }

    update()
    md.addEventListener('change', update)
    lg.addEventListener('change', update)
    return () => {
      md.removeEventListener('change', update)
      lg.removeEventListener('change', update)
    }
  }, [])

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const close = useCallback(() => setIsOpen(false), [])

  return { isOpen, isCollapsed, toggle, close }
}
