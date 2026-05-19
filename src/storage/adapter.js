import { openDB } from 'idb'
import { v4 as uuidv4 } from 'uuid'

const DB_NAME = 'quicklist-db'
const DB_VERSION = 1

const DEFAULT_LISTS = [
  { name: 'To-do',    icon: 'todo',      accent: '#1652B8', accentSoft: '#EFF4FF', placeholder: 'Add a task…' },
  { name: 'Shopping', icon: 'cart',      accent: '#ED7F22', accentSoft: '#FFF1E2', placeholder: 'Add to list…' },
  { name: 'Work',     icon: 'briefcase', accent: '#1A3967', accentSoft: '#E8EDF6', placeholder: 'Add work item…' },
  { name: 'Notes',    icon: 'note',      accent: '#11A76E', accentSoft: '#E7F8F0', placeholder: 'Jot a thought…' },
]

// Maps legacy emoji icons (seeded in v1) to SVG icon keys.
const EMOJI_TO_ICON_KEY = { '✓': 'todo', '🛒': 'cart', '💼': 'briefcase', '📝': 'note' }

const ICON_KEY_DEFAULTS = {
  todo:      { accent: '#1652B8', accentSoft: '#EFF4FF' },
  cart:      { accent: '#ED7F22', accentSoft: '#FFF1E2' },
  briefcase: { accent: '#1A3967', accentSoft: '#E8EDF6' },
  note:      { accent: '#11A76E', accentSoft: '#E7F8F0' },
  book:      { accent: '#3B91F1', accentSoft: '#EAF3FE' },
  heart:     { accent: '#BB1139', accentSoft: '#FCEAEE' },
  spark:     { accent: '#7A5AE0', accentSoft: '#EFEBFB' },
  home:      { accent: '#0E9099', accentSoft: '#E0F4F5' },
  star:      { accent: '#EDBD43', accentSoft: '#FDF6E0' },
  coffee:    { accent: '#ED7F22', accentSoft: '#FFF1E2' },
  music:     { accent: '#7A5AE0', accentSoft: '#EFEBFB' },
  map:       { accent: '#11A76E', accentSoft: '#E7F8F0' },
  calendar:  { accent: '#1652B8', accentSoft: '#EFF4FF' },
  code:      { accent: '#1A3967', accentSoft: '#E8EDF6' },
}

// Enrich a raw DB list record with derived display fields.
export function enrichList(list) {
  const KNOWN_KEYS = Object.keys(ICON_KEY_DEFAULTS)
  const iconKey = KNOWN_KEYS.includes(list.icon)
    ? list.icon
    : (EMOJI_TO_ICON_KEY[list.icon] || 'todo')
  const defaults = ICON_KEY_DEFAULTS[iconKey] || ICON_KEY_DEFAULTS.todo
  return {
    ...list,
    iconKey,
    accent:      list.accent      || defaults.accent,
    accentSoft:  list.accentSoft  || defaults.accentSoft,
    placeholder: list.placeholder || `Add to ${list.name.toLowerCase()}…`,
  }
}

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const listsStore = db.createObjectStore('lists', { keyPath: 'id' })
    listsStore.createIndex('order', 'order')

    const itemsStore = db.createObjectStore('items', { keyPath: 'id' })
    itemsStore.createIndex('listId', 'listId')
    itemsStore.createIndex('order', 'order')
  },
})

async function seedIfEmpty(database) {
  const count = await database.count('lists')
  if (count > 0) return

  const tx = database.transaction('lists', 'readwrite')
  const now = new Date().toISOString()
  await Promise.all(
    DEFAULT_LISTS.map((l, i) =>
      tx.store.add({
        id: uuidv4(),
        name: l.name,
        icon: l.icon,
        accent: l.accent,
        accentSoft: l.accentSoft,
        placeholder: l.placeholder,
        order: i,
        createdAt: now,
      })
    )
  )
  await tx.done

  if (navigator.storage?.persist) {
    navigator.storage.persist()
  }
}

// readyPromise resolves only after seeding is done; reads wait on it so a
// fresh DB isn't queried before the default lists are inserted.
const readyPromise = dbPromise.then(seedIfEmpty)

// ── lists ──────────────────────────────────────────────────────────────────

async function listsGetAll() {
  await readyPromise
  const db = await dbPromise
  return db.getAllFromIndex('lists', 'order')
}

async function listsAdd({ name, icon, accent, accentSoft, placeholder }) {
  const db = await dbPromise
  const all = await db.getAllFromIndex('lists', 'order')
  const record = {
    id: uuidv4(),
    name,
    icon: icon || 'todo',
    accent:      accent      || ICON_KEY_DEFAULTS[icon]?.accent      || '#1652B8',
    accentSoft:  accentSoft  || ICON_KEY_DEFAULTS[icon]?.accentSoft  || '#EFF4FF',
    placeholder: placeholder || `Add to ${name.toLowerCase()}…`,
    order: all.length,
    createdAt: new Date().toISOString(),
  }
  await db.add('lists', record)
  return record
}

async function listsUpdate(id, changes) {
  const db = await dbPromise
  const existing = await db.get('lists', id)
  if (!existing) throw new Error(`List ${id} not found`)
  const updated = { ...existing, ...changes, id }
  await db.put('lists', updated)
  return updated
}

async function listsRemove(id) {
  const db = await dbPromise
  await db.delete('lists', id)
}

// ── items ──────────────────────────────────────────────────────────────────

async function itemsGetAll() {
  await readyPromise
  const db = await dbPromise
  return db.getAllFromIndex('items', 'order')
}

async function itemsGetByListId(listId) {
  const db = await dbPromise
  const all = await db.getAllFromIndex('items', 'listId', listId)
  return all.sort((a, b) => a.order - b.order)
}

async function itemsAdd({ listId, text }) {
  const db = await dbPromise
  const existing = await db.getAllFromIndex('items', 'listId', listId)
  const record = {
    id: uuidv4(),
    listId,
    text,
    completed: false,
    order: existing.length,
    createdAt: new Date().toISOString(),
  }
  await db.add('items', record)
  return record
}

async function itemsUpdate(id, changes) {
  const db = await dbPromise
  const existing = await db.get('items', id)
  if (!existing) throw new Error(`Item ${id} not found`)
  const updated = { ...existing, ...changes, id }
  await db.put('items', updated)
  return updated
}

async function itemsRemove(id) {
  const db = await dbPromise
  await db.delete('items', id)
}

async function itemsReorder(listId, orderedIds) {
  const db = await dbPromise
  const tx = db.transaction('items', 'readwrite')
  await Promise.all(
    orderedIds.map(async (id, index) => {
      const item = await tx.store.get(id)
      if (item && item.listId === listId) {
        await tx.store.put({ ...item, order: index })
      }
    })
  )
  await tx.done
}

// ── export / import ────────────────────────────────────────────────────────

async function exportJSON() {
  const db = await dbPromise
  const lists = await db.getAllFromIndex('lists', 'order')
  const items = await db.getAllFromIndex('items', 'order')
  return JSON.stringify({ exportedAt: new Date().toISOString(), lists, items }, null, 2)
}

async function importJSON(jsonString) {
  const { lists, items } = JSON.parse(jsonString)
  const db = await dbPromise
  const tx = db.transaction(['lists', 'items'], 'readwrite')
  await tx.objectStore('lists').clear()
  await tx.objectStore('items').clear()
  await Promise.all(lists.map(l => tx.objectStore('lists').put(l)))
  await Promise.all(items.map(i => tx.objectStore('items').put(i)))
  await tx.done
}

// ── public API ─────────────────────────────────────────────────────────────

export const db = {
  lists: {
    getAll: listsGetAll,
    add: listsAdd,
    update: listsUpdate,
    remove: listsRemove,
  },
  items: {
    getAll: itemsGetAll,
    getByListId: itemsGetByListId,
    add: itemsAdd,
    update: itemsUpdate,
    remove: itemsRemove,
    reorder: itemsReorder,
  },
  exportJSON,
  importJSON,
}

if (import.meta.env.DEV) {
  window.db = db
}
