import { useRef, useLayoutEffect, useState } from 'react'
import { ICON_REGISTRY, TodoIcon, PlusIcon } from './Icon.jsx'

function TabButton({ list, active, tabRef, onTap, onLongPress }) {
  const timer = useRef(null)
  const longFired = useRef(false)
  const IconComp = ICON_REGISTRY[list.iconKey] || TodoIcon

  const cancel = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
  const onPointerDown = () => {
    longFired.current = false
    timer.current = setTimeout(() => { longFired.current = true; onLongPress?.() }, 480)
  }
  const onPointerUp = () => { cancel(); if (!longFired.current) onTap?.() }

  return (
    <button
      ref={tabRef}
      aria-label={list.name}
      aria-pressed={active}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      style={{
        height: 52, background: 'transparent', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 7, padding: '0 16px', cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 14, fontWeight: active ? 600 : 500,
        color: active ? list.accent : 'var(--c-neutral-subtitle)',
        whiteSpace: 'nowrap', flexShrink: 0,
        transition: 'color 160ms ease', userSelect: 'none',
      }}
    >
      <IconComp size={18} stroke={2} />
      {list.name}
    </button>
  )
}

export function TopTabs({ lists, idx, onChange, onAddTab, onMenuTab }) {
  const containerRef = useRef(null)
  const tabRefs = useRef([])
  const [underline, setUnderline] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const el = tabRefs.current[idx]
    const cont = containerRef.current
    if (!el || !cont) return
    setUnderline({ left: el.offsetLeft, width: el.offsetWidth })
    const elLeft = el.offsetLeft
    const elRight = elLeft + el.offsetWidth
    const viewLeft = cont.scrollLeft
    const viewRight = viewLeft + cont.clientWidth
    const pad = 24
    if (elLeft < viewLeft + pad) cont.scrollTo({ left: elLeft - pad, behavior: 'smooth' })
    else if (elRight > viewRight - pad) cont.scrollTo({ left: elRight - cont.clientWidth + pad, behavior: 'smooth' })
  }, [idx, lists.length])

  return (
    <div style={{
      background: 'var(--c-neutral-white)',
      borderBottom: '1px solid var(--c-neutral-light)',
      position: 'relative',
    }}>
      <div
        ref={containerRef}
        className="quicklist-tabs"
        style={{
          display: 'flex', overflowX: 'auto', overflowY: 'hidden',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch', position: 'relative',
        }}
      >
        <div style={{ display: 'flex', minWidth: '100%', position: 'relative' }}>
          {lists.map((list, i) => (
            <TabButton
              key={list.id}
              list={list}
              active={i === idx}
              tabRef={(el) => { tabRefs.current[i] = el }}
              onTap={() => onChange(i)}
              onLongPress={() => onMenuTab?.(list.id)}
            />
          ))}
          <button
            onClick={onAddTab}
            aria-label="Add category"
            style={{
              height: 52, background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 14px', cursor: 'pointer',
              color: 'var(--c-neutral-subtitle)', flexShrink: 0,
            }}
          >
            <span style={{
              width: 28, height: 28, borderRadius: 999,
              background: 'var(--c-neutral-bg)',
              border: '1px dashed var(--c-neutral-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--c-neutral-subtitle)',
            }}>
              <PlusIcon size={16} stroke={2.25} />
            </span>
          </button>
          {/* Animated underline */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            width: underline.width, height: 3,
            background: lists[idx]?.accent || 'var(--c-primary-base)',
            transform: `translateX(${underline.left}px)`,
            transition: 'transform 280ms cubic-bezier(.2,.7,.2,1), width 280ms cubic-bezier(.2,.7,.2,1), background 200ms ease',
            borderRadius: 2, pointerEvents: 'none',
          }} />
        </div>
      </div>
      {/* Right-edge fade */}
      <div aria-hidden style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 32,
        background: 'linear-gradient(to left, var(--c-neutral-white), rgba(255,255,255,0))',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
