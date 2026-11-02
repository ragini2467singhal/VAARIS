'use client'
import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    // Check if device supports hover (ignore touch devices to avoid frozen cursor on mobile)
    if (window.matchMedia('(hover: none)').matches) return

    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top = e.clientY + 'px'
      }
      setTimeout(() => {
        if (ringRef.current) {
          ringRef.current.style.left = e.clientX + 'px'
          ringRef.current.style.top = e.clientY + 'px'
        }
      }, 60)
    }

    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '0'
      if (ringRef.current) ringRef.current.style.opacity = '0'
    }

    const handleMouseEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '1'
      if (ringRef.current) ringRef.current.style.opacity = isHovering ? '0.2' : '0.5'
    }

    const handleInteractionOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive = target.closest('a, button, input, textarea, select, label, [role="button"]') !== null
      
      if (isInteractive) {
        setIsHovering(true)
        if (ringRef.current) {
          ringRef.current.style.transform = 'translate(-50%, -50%) scale(1.5)'
          ringRef.current.style.opacity = '0.2'
          ringRef.current.style.borderWidth = '2px'
        }
        if (cursorRef.current) {
          cursorRef.current.style.transform = 'translate(-50%, -50%) scale(0.5)'
        }
      } else {
        setIsHovering(false)
        if (ringRef.current) {
          ringRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
          ringRef.current.style.opacity = '0.5'
          ringRef.current.style.borderWidth = '1px'
        }
        if (cursorRef.current) {
          cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
        }
      }
    }

    window.addEventListener('mousemove', moveCursor)
    document.addEventListener('mouseover', handleInteractionOver)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      document.removeEventListener('mouseover', handleInteractionOver)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [isHovering])

  return (
    <div className="hidden lg:block pointer-events-none sticky top-0 left-0 z-[10000]">
      <div ref={cursorRef} className="cursor" />
      <div ref={ringRef} className="cursor-ring" />
    </div>
  )
}
