import { useState, useEffect, useRef } from 'react'
import { db, enrichList } from './storage/adapter.js'
import { TopTabs } from './components/TopTabs.jsx'
import { ItemList } from './components/ItemList.jsx'
import { Composer } from './components/Composer.jsx'
import { CategorySheet, CategoryMenu, ConfirmDialog } from './components/CategorySheet.jsx'
import { SettingsPanel } from './components/SettingsPanel.jsx'
import { ICON_REGISTRY, TodoIcon, SearchIcon, MoreIcon } from './components/Icon.jsx'

// ── Page (single category content area) ────────────────────────────────────
function Page({ list, items, onToggle, onDelete, onReorder, revealedId, setRevealedId, pageCount }) {
  const activeCount = items.filter(i => !i.completed).length
  const IconComp = ICON_REGISTRY[list.iconKey] || TodoIcon

  return (
    <div style={{
      width: `${100 / pageCount}%`, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: 'var(--c-neutral-bg)',
    }}>
      {/* Hero */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12, fontWeight: 500, letterSpacing: 0.6, textTransform: 'uppercase',
            color: list.accent, marginBottom: 4,
          }}>
            {activeCount === 0 ? 'No items' : `${activeCount} ${activeCount === 1 ? 'item' : 'items'} left`}
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 28, lineHeight: '32px', fontWeight: 600,
            color: 'var(--c-neutral-title)', letterSpacing: '-0.01em',
          }}>
            {list.name}
          </div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: list.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: list.accent, flexShrink: 0,
        }}>
          <IconComp size={22} stroke={2} />
        </div>
      </div>

      <ItemList
        items={items}
        accent={list.accent}
        onToggle={onToggle}
        onDelete={onDelete}
        onReorder={onReorder}
        revealedId={revealedId}
        setRevealedId={setRevealedId}
      />
    </div>
  )
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const [lists, setLists] = useState([])           // enriched list records
  const [itemsByListId, setItemsByListId] = useState({})  // { listId: Item[] }
  const [loading, setLoading] = useState(true)
  const [pageIdx, setPageIdx] = useState(0)
  const [revealedId, setRevealedId] = useState(null)
  const [sheet, setSheet] = useState(null)         // { mode: 'create'|'edit', initial?: list }
  const [menuListId, setMenuListId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [blockedDeleteId, setBlockedDeleteId] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ── Shrink to visual viewport so keyboard doesn't hide the Composer ────────
  useEffect(() => {
    const vv = window.visualViewport
    const sync = () => {
      const h = vv ? vv.height : window.innerHeight
      document.documentElement.style.setProperty('--app-h', `${h}px`)
    }
    sync()
    vv?.addEventListener('resize', sync)
    return () => vv?.removeEventListener('resize', sync)
  }, [])

  // ── Load data from IndexedDB ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([db.lists.getAll(), db.items.getAll()]).then(([rawLists, items]) => {
      const enriched = rawLists.map(enrichList)
      setLists(enriched)

      const byId = {}
      items.forEach(item => {
        if (!byId[item.listId]) byId[item.listId] = []
        byId[item.listId].push(item)
      })
      Object.values(byId).forEach(arr => arr.sort((a, b) => a.order - b.order))
      setItemsByListId(byId)
      setLoading(false)
    })
  }, [])

  const reloadData = async () => {
    const [rawLists, items] = await Promise.all([db.lists.getAll(), db.items.getAll()])
    const enriched = rawLists.map(enrichList)
    setLists(enriched)
    const byId = {}
    items.forEach(item => {
      if (!byId[item.listId]) byId[item.listId] = []
      byId[item.listId].push(item)
    })
    Object.values(byId).forEach(arr => arr.sort((a, b) => a.order - b.order))
    setItemsByListId(byId)
    setPageIdx(0)
  }

  // ── Item mutations ────────────────────────────────────────────────────────
  const handleToggle = async (listId, itemId) => {
    const item = itemsByListId[listId]?.find(i => i.id === itemId)
    if (!item) return
    const updated = await db.items.update(itemId, { completed: !item.completed })
    setItemsByListId(prev => ({
      ...prev,
      [listId]: prev[listId].map(i => i.id === itemId ? updated : i),
    }))
  }

  const handleDelete = async (listId, itemId) => {
    await db.items.remove(itemId)
    setItemsByListId(prev => ({
      ...prev,
      [listId]: (prev[listId] || []).filter(i => i.id !== itemId),
    }))
  }

  const handleAdd = async (listId, text) => {
    const item = await db.items.add({ listId, text })
    setItemsByListId(prev => ({
      ...prev,
      [listId]: [...(prev[listId] || []), item],
    }))
  }

  const handleReorder = async (listId, fromIdx, toIdx) => {
    const current = (itemsByListId[listId] || []).filter(i => !i.completed)
    const reordered = [...current]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const completed = (itemsByListId[listId] || []).filter(i => i.completed)
    const next = [...reordered, ...completed]

    setItemsByListId(prev => ({ ...prev, [listId]: next }))
    await db.items.reorder(listId, reordered.map(i => i.id))
  }

  // ── List (category) mutations ─────────────────────────────────────────────
  const handleSaveCategory = async (data) => {
    if (sheet?.mode === 'edit' && sheet.initial) {
      const updated = await db.lists.update(sheet.initial.id, {
        name: data.name, icon: data.icon,
        accent: data.accent, accentSoft: data.accentSoft,
        placeholder: `Add to ${data.name.toLowerCase()}…`,
      })
      setLists(prev => prev.map(l => l.id === sheet.initial.id ? enrichList(updated) : l))
    } else {
      const record = await db.lists.add({
        name: data.name, icon: data.icon,
        accent: data.accent, accentSoft: data.accentSoft,
      })
      const enriched = enrichList(record)
      setLists(prev => [...prev, enriched])
      setItemsByListId(prev => ({ ...prev, [record.id]: [] }))
      setTimeout(() => setPageIdx(lists.length), 0)
    }
    setSheet(null)
  }

  const handleDeleteCategory = async (listId) => {
    const idx = lists.findIndex(l => l.id === listId)
    await db.lists.remove(listId)
    setLists(prev => prev.filter(l => l.id !== listId))
    setItemsByListId(prev => { const next = { ...prev }; delete next[listId]; return next })
    setPageIdx(p => {
      if (p > idx) return p - 1
      if (p === idx) return Math.max(0, p - 1)
      return p
    })
  }

  // ── Horizontal swipe between pages ───────────────────────────────────────
  const swipeRef = useRef(null)
  const N = lists.length

  const onTrackPointerDown = (e) => {
    if (e.target.closest('.row-outer')) return
    if (e.target.closest('[data-stop-row]')) return
    swipeRef.current = { x0: e.clientX, y0: e.clientY, decided: null }
  }
  const onTrackPointerMove = (e) => {
    const s = swipeRef.current
    if (!s) return
    const dx = e.clientX - s.x0
    const dy = e.clientY - s.y0
    if (!s.decided) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      s.decided = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    if (s.decided === 'h') s.dx = dx
  }
  const onTrackPointerUp = () => {
    const s = swipeRef.current
    swipeRef.current = null
    if (!s || s.decided !== 'h' || s.dx === undefined) return
    const THRESH = 60
    if (s.dx < -THRESH && pageIdx < N - 1) setPageIdx(pageIdx + 1)
    else if (s.dx > THRESH && pageIdx > 0) setPageIdx(pageIdx - 1)
  }

  useEffect(() => { setRevealedId(null) }, [pageIdx])

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-neutral-bg)' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--c-neutral-placeholder)' }}>Loading…</div>
      </div>
    )
  }

  const currentList = lists[pageIdx]
  const menuList = menuListId ? lists.find(l => l.id === menuListId) : null
  const confirmList = confirmId ? lists.find(l => l.id === confirmId) : null
  const confirmItemCount = confirmList ? (itemsByListId[confirmList.id]?.length ?? 0) : 0

  return (
    <div style={{ height: 'var(--app-h, 100%)', display: 'flex', flexDirection: 'column', background: 'var(--c-neutral-bg)', position: 'relative', overflow: 'hidden' }}>

      {/* App bar */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--c-neutral-white)', gap: 12, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: 'var(--c-brand-navy)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em',
        }}>Q</div>
        <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600, color: 'var(--c-neutral-title)', letterSpacing: '-0.01em' }}>
          Quicklist
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 999, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-neutral-subtitle)', cursor: 'pointer' }}>
          <SearchIcon size={20} />
        </button>
        <button onClick={() => setSettingsOpen(true)} style={{ width: 36, height: 36, borderRadius: 999, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-neutral-subtitle)', cursor: 'pointer' }}>
          <MoreIcon size={20} />
        </button>
      </div>

      <TopTabs
        lists={lists}
        idx={pageIdx}
        onChange={(i) => { setRevealedId(null); setPageIdx(i) }}
        onAddTab={() => setSheet({ mode: 'create', initial: null })}
        onMenuTab={(id) => setMenuListId(id)}
      />

      {/* Pages track */}
      <div
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
        onPointerCancel={onTrackPointerUp}
        style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
      >
        <div style={{
          display: 'flex', height: '100%',
          width: `${N * 100}%`,
          transform: `translateX(-${pageIdx * (100 / N)}%)`,
          transition: 'transform 320ms cubic-bezier(.2,.7,.2,1)',
        }}>
          {lists.map((list) => (
            <Page
              key={list.id}
              list={list}
              pageCount={N}
              items={itemsByListId[list.id] || []}
              onToggle={(itemId) => handleToggle(list.id, itemId)}
              onDelete={(itemId) => handleDelete(list.id, itemId)}
              onReorder={(from, to) => handleReorder(list.id, from, to)}
              revealedId={revealedId}
              setRevealedId={setRevealedId}
            />
          ))}
        </div>
      </div>

      {currentList && (
        <Composer
          list={currentList}
          onAdd={(text) => handleAdd(currentList.id, text)}
        />
      )}

      {/* Overlays */}
      <CategorySheet
        open={!!sheet}
        mode={sheet?.mode}
        initial={sheet?.initial}
        onClose={() => setSheet(null)}
        onSave={handleSaveCategory}
      />

      <CategoryMenu
        open={!!menuList}
        list={menuList}
        onClose={() => setMenuListId(null)}
        onEdit={() => {
          const id = menuListId
          setMenuListId(null)
          const list = lists.find(l => l.id === id)
          if (list) setSheet({ mode: 'edit', initial: list })
        }}
        onDelete={() => {
          const id = menuListId
          setMenuListId(null)
          if ((itemsByListId[id] || []).length > 0) {
            setBlockedDeleteId(id)
          } else {
            setConfirmId(id)
          }
        }}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onImportSuccess={() => { setSettingsOpen(false); reloadData() }}
      />

      <ConfirmDialog
        open={!!blockedDeleteId}
        title="Cannot delete list"
        body="Clear all items before deleting this list."
        blocked
        onCancel={() => setBlockedDeleteId(null)}
      />

      <ConfirmDialog
        open={!!confirmList}
        title={`Delete "${confirmList?.name}"?`}
        body={
          confirmItemCount > 0
            ? `This will permanently remove the category and ${confirmItemCount} item${confirmItemCount === 1 ? '' : 's'} inside it.`
            : 'This will permanently remove the category.'
        }
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmId(null)}
        onConfirm={() => { handleDeleteCategory(confirmId); setConfirmId(null) }}
      />
    </div>
  )
}
