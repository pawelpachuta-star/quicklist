import { useState, useRef } from 'react'
import { PlusIcon } from './Icon.jsx'

export function Composer({ list, onAdd }) {
  const [val, setVal] = useState('')
  const inputRef = useRef(null)

  const submit = () => {
    const t = val.trim()
    if (!t) return
    onAdd(t)
    setVal('')
    inputRef.current?.focus()
  }

  return (
    <div style={{
      borderTop: '1px solid var(--c-neutral-light)',
      background: 'var(--c-neutral-white)',
      padding: '8px 12px 10px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{
        flex: 1, height: 44,
        background: 'var(--c-neutral-bg)',
        border: '1px solid var(--c-neutral-light)',
        borderRadius: 999,
        display: 'flex', alignItems: 'center',
        paddingLeft: 16, paddingRight: 8,
        transition: 'border-color 160ms ease, box-shadow 160ms ease',
      }}>
        <input
          ref={inputRef}
          aria-label="New item"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder={list?.placeholder || 'Add a task…'}
          style={{
            flex: 1, height: '100%',
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: 16, color: 'var(--c-neutral-title)', minWidth: 0,
          }}
        />
      </div>
      <button
        onClick={submit}
        aria-label="Add"
        style={{
          width: 44, height: 44, borderRadius: 999, border: 'none', flexShrink: 0,
          background: val.trim() ? list?.accent : 'var(--c-neutral-bg-hover)',
          color: val.trim() ? '#fff' : 'var(--c-neutral-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: val.trim() ? 'pointer' : 'default',
          transition: 'background 160ms ease, color 160ms ease',
          boxShadow: val.trim() ? `0 4px 10px ${list?.accent}40` : 'none',
        }}
      >
        <PlusIcon size={22} stroke={2.25} />
      </button>
    </div>
  )
}
