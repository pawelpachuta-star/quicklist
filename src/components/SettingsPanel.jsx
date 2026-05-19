import { useState, useRef } from 'react'
import { db } from '../storage/adapter.js'
import { ConfirmDialog } from './CategorySheet.jsx'
import { XIcon } from './Icon.jsx'

const LS_KEY = 'ql_last_export'

function formatDate(iso) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function SettingsRow({ label, description, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', background: 'transparent', border: 'none',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', textAlign: 'left',
        borderBottom: '1px solid var(--c-neutral-light)',
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500, color: 'var(--c-neutral-title)' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-neutral-placeholder)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <span style={{ color: 'var(--c-neutral-border)', fontSize: 20, lineHeight: 1 }}>›</span>
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '20px 20px 8px',
      fontFamily: 'var(--font-sans)',
      fontSize: 11, fontWeight: 600, letterSpacing: 0.7,
      textTransform: 'uppercase', color: 'var(--c-neutral-placeholder)',
    }}>
      {children}
    </div>
  )
}

export function SettingsPanel({ open, onClose, onImportSuccess }) {
  const [lastExport, setLastExport] = useState(() => localStorage.getItem(LS_KEY))
  const [importPending, setImportPending] = useState(null) // raw json string awaiting confirm
  const [importStatus, setImportStatus] = useState(null)  // 'success' | { error: string }
  const fileRef = useRef(null)

  const handleExport = async () => {
    try {
      const json = await db.exportJSON()
      const date = new Date().toISOString().slice(0, 10)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quicklist-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const now = new Date().toISOString()
      localStorage.setItem(LS_KEY, now)
      setLastExport(now)
    } catch (e) {
      // Export failures are silent — browser download is best-effort
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImportPending(ev.target.result)
      setImportStatus(null)
    }
    reader.onerror = () => setImportStatus({ error: 'Could not read file.' })
    reader.readAsText(file)
    // Reset so the same file can be picked again
    e.target.value = ''
  }

  const handleImportConfirm = async () => {
    try {
      await db.importJSON(importPending)
      setImportPending(null)
      setImportStatus('success')
      onImportSuccess()
    } catch (e) {
      setImportPending(null)
      setImportStatus({ error: e?.message || 'Import failed. Make sure the file is a valid Quicklist export.' })
    }
  }

  return (
    <>
      {/* Panel */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: 'var(--c-neutral-bg)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 280ms cubic-bezier(.2,.7,.2,1)',
        display: 'flex', flexDirection: 'column',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        {/* Header */}
        <div style={{
          height: 52, display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12,
          background: 'var(--c-neutral-white)',
          borderBottom: '1px solid var(--c-neutral-light)',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--c-neutral-subtitle)', cursor: 'pointer',
            }}
          >
            <XIcon size={20} />
          </button>
          <div style={{
            flex: 1,
            fontFamily: 'var(--font-sans)',
            fontSize: 17, fontWeight: 600,
            color: 'var(--c-neutral-title)', letterSpacing: '-0.01em',
          }}>
            Settings
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SectionLabel>Data</SectionLabel>

          <div style={{ background: 'var(--c-neutral-white)', borderTop: '1px solid var(--c-neutral-light)' }}>
            <SettingsRow
              label="Export data"
              description={`Last exported: ${formatDate(lastExport)}`}
              onClick={handleExport}
            />
            <SettingsRow
              label="Import data"
              description="Replaces all current data"
              onClick={() => fileRef.current?.click()}
            />
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Import status message */}
          {importStatus && (
            <div style={{
              margin: '16px 20px 0',
              padding: '12px 16px',
              borderRadius: 10,
              background: importStatus === 'success' ? '#E7F8F0' : '#FCEAEE',
              fontFamily: 'var(--font-sans)',
              fontSize: 14, lineHeight: '20px',
              color: importStatus === 'success' ? '#11A76E' : 'var(--c-warning-base)',
            }}>
              {importStatus === 'success'
                ? 'Data imported successfully.'
                : importStatus.error}
            </div>
          )}
        </div>
      </div>

      {/* Import confirm dialog — rendered inside the panel's stacking context */}
      <ConfirmDialog
        open={!!importPending}
        title="Replace all data?"
        body="This will replace ALL your current data. Continue?"
        confirmLabel="Import"
        danger
        onCancel={() => setImportPending(null)}
        onConfirm={handleImportConfirm}
      />
    </>
  )
}
