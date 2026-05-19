import { useState, useEffect, useRef } from 'react'
import { ICON_REGISTRY, ICON_KEYS, TodoIcon, XIcon, PencilIcon, TrashIcon } from './Icon.jsx'

const COLOR_PALETTE = [
  { accent: '#1652B8', soft: '#EFF4FF' },
  { accent: '#ED7F22', soft: '#FFF1E2' },
  { accent: '#1A3967', soft: '#E8EDF6' },
  { accent: '#11A76E', soft: '#E7F8F0' },
  { accent: '#3B91F1', soft: '#EAF3FE' },
  { accent: '#BB1139', soft: '#FCEAEE' },
  { accent: '#7A5AE0', soft: '#EFEBFB' },
  { accent: '#0E9099', soft: '#E0F4F5' },
]

function Scrim({ onClick, opacity = 0.5 }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute', inset: 0,
        background: `rgba(17, 19, 34, ${opacity})`,
        zIndex: 10, animation: 'ql-fade 200ms ease',
      }}
    />
  )
}

function BottomSheet({ children, onClose }) {
  return (
    <>
      <Scrim onClick={onClose} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--c-neutral-white)',
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
        zIndex: 11, maxHeight: '85%', overflowY: 'auto',
        boxShadow: '0 -10px 32px hsla(220,43%,11%,.15)',
        animation: 'ql-sheet-up 280ms cubic-bezier(.2,.7,.2,1)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--c-neutral-light)', margin: '10px auto 4px' }} />
        {children}
      </div>
    </>
  )
}

export function CategorySheet({ open, mode, initial, onClose, onSave }) {
  const [label, setLabel] = useState('')
  const [iconKey, setIconKey] = useState('todo')
  const [colorIdx, setColorIdx] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setLabel(initial?.name ?? '')
    setIconKey(initial?.iconKey ?? 'todo')
    const ci = COLOR_PALETTE.findIndex(c => c.accent === initial?.accent)
    setColorIdx(ci >= 0 ? ci : 0)
    setTimeout(() => inputRef.current?.focus(), 280)
  }, [open, initial])

  if (!open) return null

  const color = COLOR_PALETTE[colorIdx]
  const PreviewIcon = ICON_REGISTRY[iconKey] || TodoIcon
  const trimmed = label.trim()
  const canSave = trimmed.length > 0

  const submit = () => {
    if (!canSave) return
    onSave({ name: trimmed, icon: iconKey, accent: color.accent, accentSoft: color.soft })
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '8px 20px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingTop: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: color.soft, color: color.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 180ms ease, color 180ms ease', flexShrink: 0,
          }}>
            <PreviewIcon size={24} stroke={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--c-neutral-placeholder)', marginBottom: 2 }}>
              {mode === 'edit' ? 'Edit category' : 'New category'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--c-neutral-title)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trimmed || 'Untitled'}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--c-neutral-bg)', border: 'none', color: 'var(--c-neutral-subtitle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <XIcon size={18} />
          </button>
        </div>

        {/* Name */}
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--c-neutral-subtitle)', marginBottom: 8 }}>Name</label>
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="e.g. Recipes, Travel, Gifts…"
          maxLength={24}
          onFocus={(e) => { e.currentTarget.style.borderColor = color.accent; e.currentTarget.style.boxShadow = `0 0 0 4px ${color.accent}22` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--c-neutral-light)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{
            width: '100%', height: 44,
            background: 'var(--c-neutral-bg)', border: '1px solid var(--c-neutral-light)',
            borderRadius: 10, padding: '0 14px',
            fontFamily: 'var(--font-sans)', fontSize: 16,
            color: 'var(--c-neutral-title)', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 160ms ease, box-shadow 160ms ease',
          }}
        />

        {/* Icon picker */}
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--c-neutral-subtitle)', margin: '20px 0 10px' }}>Icon</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {ICON_KEYS.map((key) => {
            const IconComp = ICON_REGISTRY[key]
            const selected = iconKey === key
            return (
              <button
                key={key}
                onClick={() => setIconKey(key)}
                aria-label={`Icon ${key}`}
                style={{
                  aspectRatio: '1 / 1', borderRadius: 10, padding: 0,
                  background: selected ? color.soft : 'var(--c-neutral-bg)',
                  border: selected ? `1.5px solid ${color.accent}` : '1.5px solid transparent',
                  color: selected ? color.accent : 'var(--c-neutral-subtitle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 140ms ease, border-color 140ms ease, color 140ms ease',
                }}
              >
                <IconComp size={20} stroke={1.9} />
              </button>
            )
          })}
        </div>

        {/* Color picker */}
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--c-neutral-subtitle)', margin: '20px 0 10px' }}>Color</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {COLOR_PALETTE.map((c, i) => {
            const selected = colorIdx === i
            return (
              <button
                key={c.accent}
                onClick={() => setColorIdx(i)}
                aria-label={`Color ${c.accent}`}
                style={{
                  width: 34, height: 34, borderRadius: 999, padding: 0,
                  background: c.accent,
                  border: '2px solid var(--c-neutral-white)',
                  boxShadow: selected ? `0 0 0 2px ${c.accent}` : '0 0 0 1px var(--c-neutral-light)',
                  cursor: 'pointer',
                  transition: 'box-shadow 140ms ease, transform 140ms ease',
                  transform: selected ? 'scale(1.06)' : 'scale(1)',
                }}
              />
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 10, background: 'var(--c-neutral-bg)', border: '1px solid var(--c-neutral-light)', color: 'var(--c-neutral-section)', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSave}
            style={{
              flex: 1.4, height: 44, borderRadius: 10, border: 'none',
              background: canSave ? color.accent : 'var(--c-neutral-bg-hover)',
              color: canSave ? '#fff' : 'var(--c-neutral-border)',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
              cursor: canSave ? 'pointer' : 'default',
              transition: 'background 160ms ease',
              boxShadow: canSave ? `0 4px 10px ${color.accent}40` : 'none',
            }}
          >
            {mode === 'edit' ? 'Save changes' : 'Add category'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

export function CategoryMenu({ open, list, onClose, onEdit, onDelete }) {
  if (!open || !list) return null
  const IconComp = ICON_REGISTRY[list.iconKey] || TodoIcon

  return (
    <>
      <Scrim onClick={onClose} opacity={0.35} />
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 28,
        background: 'var(--c-neutral-white)', borderRadius: 16, zIndex: 11,
        overflow: 'hidden', boxShadow: '0 12px 32px hsla(220,43%,11%,.18)',
        animation: 'ql-menu-up 220ms cubic-bezier(.2,.7,.2,1)',
      }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--c-neutral-light)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: list.accentSoft, color: list.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconComp size={18} stroke={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: 'var(--c-neutral-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {list.name}
          </div>
        </div>
        <MenuRow icon={<PencilIcon size={20} />} label="Edit" onClick={onEdit} />
        <MenuRow icon={<TrashIcon size={20} />} label="Delete category" danger onClick={onDelete} />
        <button onClick={onClose} style={{ width: '100%', height: 48, background: 'var(--c-neutral-bg)', border: 'none', borderTop: '1px solid var(--c-neutral-light)', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, color: 'var(--c-neutral-section)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </>
  )
}

function MenuRow({ icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', height: 52, background: 'transparent', border: 'none',
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
        fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500,
        color: danger ? 'var(--c-warning-base)' : 'var(--c-neutral-title)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ color: danger ? 'var(--c-warning-base)' : 'var(--c-neutral-subtitle)', display: 'inline-flex' }}>{icon}</span>
      {label}
    </button>
  )
}

export function ConfirmDialog({ open, title, body, confirmLabel, danger, onCancel, onConfirm, blocked }) {
  if (!open) return null
  return (
    <>
      <Scrim onClick={onCancel} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 12, pointerEvents: 'none' }}>
        <div style={{ background: 'var(--c-neutral-white)', borderRadius: 16, width: '100%', maxWidth: 340, padding: 22, boxShadow: '0 20px 40px hsla(220,43%,11%,.20)', pointerEvents: 'auto', animation: 'ql-menu-up 220ms cubic-bezier(.2,.7,.2,1)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--c-neutral-title)', marginBottom: 6, letterSpacing: '-0.01em' }}>{title}</div>
          <div style={{ fontSize: 14, lineHeight: '20px', color: 'var(--c-neutral-body)', marginBottom: 18 }}>{body}</div>
          {blocked ? (
            <button onClick={onCancel} style={{ width: '100%', height: 42, borderRadius: 10, background: 'var(--c-neutral-bg)', border: '1px solid var(--c-neutral-light)', color: 'var(--c-neutral-section)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>OK</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onCancel} style={{ flex: 1, height: 42, borderRadius: 10, background: 'var(--c-neutral-bg)', border: '1px solid var(--c-neutral-light)', color: 'var(--c-neutral-section)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={onConfirm} style={{ flex: 1, height: 42, borderRadius: 10, background: danger ? 'var(--c-warning-base)' : 'var(--c-primary-base)', border: 'none', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{confirmLabel}</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
