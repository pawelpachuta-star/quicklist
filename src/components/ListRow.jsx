import { useState, useRef, useEffect } from 'react'
import { CheckIcon, TrashIcon, DragIcon } from './Icon.jsx'

const REVEAL = 84

export function ListRow({
  item, accent,
  onToggle, onDelete,
  dragListeners,
  dragging, isRevealed, onReveal, onCloseReveal,
}) {
  const [dx, setDx] = useState(isRevealed ? -REVEAL : 0)
  const startRef = useRef(null)
  const intentRef = useRef(null)
  const rootRef = useRef(null)

  useEffect(() => {
    setDx(isRevealed ? -REVEAL : 0)
  }, [isRevealed])

  const onPointerDown = (e) => {
    if (e.target.closest('[data-stop-row]')) return
    if (e.button !== undefined && e.button !== 0) return
    startRef.current = { x: e.clientX, y: e.clientY, baseDx: dx }
    intentRef.current = null
    // Delay setPointerCapture until horizontal intent confirmed — prevents iOS pointercancel
  }

  const onPointerMove = (e) => {
    if (!startRef.current) return
    const dxRaw = e.clientX - startRef.current.x
    const dyRaw = e.clientY - startRef.current.y
    if (!intentRef.current) {
      if (Math.abs(dxRaw) < 8 && Math.abs(dyRaw) < 8) return
      if (Math.abs(dxRaw) > Math.abs(dyRaw)) {
        intentRef.current = 'h'
        try { rootRef.current?.setPointerCapture?.(e.pointerId) } catch {}
      } else {
        // Vertical scroll — abandon tracking so native scroll takes over
        startRef.current = null
        intentRef.current = null
        return
      }
    }
    if (intentRef.current === 'h') {
      const base = startRef.current.baseDx ?? 0
      let next = base + dxRaw
      if (next > 0) next = Math.min(20, next * 0.25)
      if (next < -REVEAL * 1.6) next = -REVEAL * 1.6 + (next + REVEAL * 1.6) * 0.25
      setDx(next)
    }
  }

  const onPointerUp = () => {
    if (!startRef.current) return
    if (intentRef.current === 'h') {
      const open = dx < -REVEAL * 0.45
      if (open) { setDx(-REVEAL); onReveal?.(item.id) }
      else { setDx(0); onCloseReveal?.(item.id) }
    } else if (intentRef.current === null) {
      if (isRevealed) onCloseReveal?.(item.id)
      else onToggle?.(item.id)
    }
    startRef.current = null
    intentRef.current = null
  }

  const onPointerCancel = () => {
    if (!startRef.current) return
    startRef.current = null
    intentRef.current = null
    setDx(isRevealed ? -REVEAL : 0)
  }

  return (
    <div
      ref={rootRef}
      className="row-outer"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{
        position: 'relative', height: 52,
        userSelect: 'none', touchAction: 'pan-y',
        zIndex: dragging ? 5 : 1,
      }}
    >
      {/* Delete background */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: 'var(--c-warning-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      }}>
        <button
          data-stop-row
          onClick={(e) => { e.stopPropagation(); onDelete?.(item.id) }}
          style={{
            height: '100%', width: REVEAL, background: 'transparent',
            border: 'none', color: '#fff',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 12, fontWeight: 500, letterSpacing: 0.2,
          }}
        >
          <TrashIcon size={20} color="#fff" stroke={2} />
          Delete
        </button>
      </div>

      {/* Foreground row — no pointer handlers here; they live on the outer div */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'var(--c-neutral-white)',
          borderBottom: '1px solid var(--c-neutral-light)',
          display: 'flex', alignItems: 'center',
          gap: 12, paddingLeft: 16, paddingRight: 8,
          transform: `translateX(${dx}px)${dragging ? ' scale(1.015)' : ''}`,
          transition: dragging
            ? 'transform 0ms, box-shadow 160ms ease'
            : (startRef.current ? 'none' : 'transform 220ms cubic-bezier(.2,.7,.2,1)'),
          boxShadow: dragging
            ? '0 10px 24px hsla(220,43%,11%,.18), 0 4px 8px hsla(220,43%,11%,.10)'
            : 'none',
          willChange: 'transform',
          cursor: dragging ? 'grabbing' : 'default',
        }}
      >
        {/* Checkbox */}
        <button
          data-stop-row
          onClick={(e) => { e.stopPropagation(); onToggle?.(item.id) }}
          aria-label={item.completed ? 'Mark as not done' : 'Mark as done'}
          style={{
            width: 24, height: 24, borderRadius: 999, padding: 0,
            border: `1.75px solid ${item.completed ? accent : 'var(--c-neutral-border)'}`,
            background: item.completed ? accent : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
            transition: 'background 140ms ease, border-color 140ms ease',
          }}
        >
          {item.completed && <CheckIcon size={14} color="#fff" stroke={2.5} />}
        </button>

        {/* Label */}
        <div style={{
          flex: 1, minWidth: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: 16, lineHeight: '22px',
          color: item.completed ? 'var(--c-neutral-placeholder)' : 'var(--c-neutral-title)',
          textDecoration: item.completed ? 'line-through' : 'none',
          textDecorationColor: 'var(--c-neutral-border-hover)',
          textDecorationThickness: '1.5px',
          fontWeight: item.completed ? 400 : 450,
          transition: 'color 140ms ease',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.text}
        </div>

        {/* Drag handle — only for active items */}
        {!item.completed && dragListeners && (
          <div
            data-stop-row
            {...dragListeners}
            aria-label="Drag to reorder"
            style={{
              width: 36, height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--c-neutral-border)', cursor: 'grab', touchAction: 'none',
            }}
          >
            <DragIcon size={18} />
          </div>
        )}
      </div>
    </div>
  )
}
