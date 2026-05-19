import { useState } from 'react'
import {
  DndContext, closestCenter,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ListRow } from './ListRow.jsx'
import { ChevronDown, PlusIcon } from './Icon.jsx'

function SectionHeader({ count, expanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={`${expanded ? 'Collapse' : 'Expand'} completed items`}
      style={{
        width: '100%', height: 44, background: 'transparent', border: 'none',
        borderTop: '1px solid var(--c-neutral-light)',
        borderBottom: '1px solid var(--c-neutral-light)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 8,
        fontFamily: 'var(--font-sans)',
        fontSize: 13, fontWeight: 500, letterSpacing: 0.3,
        color: 'var(--c-neutral-subtitle)', textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      <span style={{
        display: 'inline-flex', transition: 'transform 200ms ease',
        transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
      }}>
        <ChevronDown size={16} color="var(--c-neutral-subtitle)" />
      </span>
      <span>Completed</span>
      <span style={{ fontWeight: 500, color: 'var(--c-neutral-placeholder)', textTransform: 'none' }}>
        {count}
      </span>
    </button>
  )
}

function EmptyState({ accent }) {
  return (
    <div style={{
      height: 280, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: 32, textAlign: 'center',
      background: 'var(--c-neutral-white)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999,
        background: `${accent}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <PlusIcon size={26} stroke={1.75} color={accent} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--c-neutral-section)' }}>
        Nothing here yet.
      </div>
      <div style={{ fontSize: 14, color: 'var(--c-neutral-placeholder)', lineHeight: '20px', maxWidth: 240 }}>
        Add your first item below.
      </div>
    </div>
  )
}

function SortableRow({ item, accent, onToggle, onDelete, revealedId, setRevealedId, animatingOut }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        zIndex: isDragging ? 5 : 1,
        position: 'relative',
        animation: animatingOut ? 'ql-slide-out 180ms ease forwards' : 'ql-fade 200ms ease',
      }}
      {...attributes}
    >
      <ListRow
        item={item}
        accent={accent}
        dragging={isDragging}
        dragListeners={listeners}
        onToggle={onToggle}
        onDelete={onDelete}
        isRevealed={revealedId === item.id}
        onReveal={setRevealedId}
        onCloseReveal={(id) => { if (revealedId === id) setRevealedId(null) }}
      />
    </div>
  )
}

export function ItemList({ items, accent, onToggle, onDelete, onReorder, revealedId, setRevealedId }) {
  const [completedExpanded, setCompletedExpanded] = useState(true)
  const [pendingComplete, setPendingComplete] = useState(new Set())

  const active = items.filter(i => !i.completed)
  const completed = items.filter(i => i.completed)

  // Intercept toggle for active→completed to animate the row out first
  const handleToggle = (id) => {
    if (pendingComplete.has(id)) return
    const item = items.find(i => i.id === id)
    if (item && !item.completed) {
      setPendingComplete(prev => new Set([...prev, id]))
      setTimeout(() => onToggle(id), 180)
    } else {
      onToggle(id)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const handleDragEnd = ({ active: a, over }) => {
    if (!over || a.id === over.id) return
    const oldIdx = active.findIndex(i => i.id === a.id)
    const newIdx = active.findIndex(i => i.id === over.id)
    if (oldIdx !== -1 && newIdx !== -1) onReorder(oldIdx, newIdx)
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {items.length === 0 && <EmptyState accent={accent} />}

      {active.length > 0 && (
        <div style={{ background: 'var(--c-neutral-white)' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={active.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {active.map(item => (
                <SortableRow
                  key={item.id}
                  item={item}
                  accent={accent}
                  onToggle={handleToggle}
                  onDelete={onDelete}
                  revealedId={revealedId}
                  setRevealedId={setRevealedId}
                  animatingOut={pendingComplete.has(item.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {completed.length > 0 && (
        <>
          <SectionHeader
            count={completed.length}
            expanded={completedExpanded}
            onToggle={() => setCompletedExpanded(v => !v)}
          />
          {/* grid-template-rows animates to actual content height, unlike max-height hacks */}
          <div style={{
            display: 'grid',
            gridTemplateRows: completedExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 280ms cubic-bezier(.2,.7,.2,1)',
          }}>
            <div style={{ overflow: 'hidden', background: 'var(--c-neutral-white)' }}>
              {completed.map(item => (
                <div key={item.id} style={{ animation: 'ql-fade 200ms ease' }}>
                  <ListRow
                    item={item}
                    accent={accent}
                    dragging={false}
                    dragListeners={null}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    isRevealed={revealedId === item.id}
                    onReveal={setRevealedId}
                    onCloseReveal={(id) => { if (revealedId === id) setRevealedId(null) }}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
