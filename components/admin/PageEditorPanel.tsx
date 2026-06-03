'use client'
import { useEffect, useRef, useState } from 'react'
import { adminCardClass, cardStyle } from '@/components/admin/AdminCard'

interface Block {
  id: string
  label: string
  visible: boolean
  order: number
  variant: string
}

const PAGES = [
  { slug: 'home',           label: 'Начална страница (/)' },
  { slug: 'cities/burgas',  label: 'Бургас (/cities/burgas)' },
  { slug: 'cities/generic', label: 'Другите градове (/cities/[slug])' },
]

const VARIANTS: Record<string, { id: string; label: string }[]> = {
  'city-cards': [
    { id: 'marble',  label: 'Мраморни' },
    { id: 'dark',    label: 'Тъмни' },
    { id: 'glass',   label: 'Стъклени' },
    { id: 'compact', label: 'Компактни' },
  ],
  quarters: [
    { id: 'marble',  label: 'Мраморни' },
    { id: 'dark',    label: 'Тъмни' },
    { id: 'grid',    label: 'Мрежа' },
  ],
  properties: [
    { id: 'grid',    label: 'Мрежа' },
    { id: 'list',    label: 'Списък' },
    { id: 'compact', label: 'Компактно' },
  ],
  search: [
    { id: 'default',  label: 'Стандартна' },
    { id: 'expanded', label: 'Разширена' },
    { id: 'minimal',  label: 'Минимална' },
  ],
  hero: [
    { id: 'default',   label: 'Стандартен' },
    { id: 'fullbleed', label: 'Пълен екран' },
    { id: 'split',     label: 'Половина' },
  ],
}

function getVariants(blockId: string) {
  return VARIANTS[blockId] ?? [{ id: 'default', label: 'По подразбиране' }]
}

export default function PageEditorPanel() {
  const [pageSlug, setPageSlug] = useState('home')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  useEffect(() => {
    load(pageSlug)
  }, [pageSlug])

  async function load(slug: string) {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch(`/api/admin/page-layouts?slug=${encodeURIComponent(slug)}`)
      const json = await res.json()
      const raw: Block[] = Array.isArray(json.blocks) ? json.blocks : []
      setBlocks(raw.sort((a, b) => a.order - b.order))
    } catch {
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const ordered = blocks.map((b, i) => ({ ...b, order: i }))
      const res = await fetch('/api/admin/page-layouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: pageSlug, blocks: ordered }),
      })
      const json = await res.json()
      setMsg(json.success ? '✓ Записано успешно' : (json.error ?? 'Грешка'))
    } catch {
      setMsg('Мрежова грешка')
    } finally {
      setSaving(false)
    }
  }

  function toggleVisible(idx: number) {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, visible: !b.visible } : b))
  }

  function changeVariant(idx: number, variant: string) {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, variant } : b))
  }

  function onDragStart(idx: number) {
    dragItem.current = idx
  }

  function onDragEnter(idx: number) {
    dragOver.current = idx
  }

  function onDragEnd() {
    if (dragItem.current === null || dragOver.current === null) return
    if (dragItem.current === dragOver.current) return

    const updated = [...blocks]
    const [dragged] = updated.splice(dragItem.current, 1)
    updated.splice(dragOver.current, 0, dragged)

    setBlocks(updated.map((b, i) => ({ ...b, order: i })))
    dragItem.current = null
    dragOver.current = null
  }

  return (
    <div>
      {/* Page selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {PAGES.map(p => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setPageSlug(p.slug)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{
              background: pageSlug === p.slug ? 'rgba(207,168,71,0.15)' : 'transparent',
              border: pageSlug === p.slug
                ? '1px solid rgba(207,168,71,0.6)'
                : '1px solid rgba(207,168,71,0.2)',
              color: pageSlug === p.slug ? 'var(--crm-gold,#CFA847)' : 'rgba(245,237,216,0.55)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm admin-text-faint py-6 text-center">Зареждане...</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm admin-text-faint py-6 text-center">Няма блокове за тази страница</p>
      ) : (
        <div className="flex flex-col gap-2 mb-5">
          <p className="text-[10px] admin-text-muted uppercase tracking-wider mb-1">
            Влачи блоковете за да ги пренаредиш
          </p>
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={onDragEnd}
              onDragOver={e => e.preventDefault()}
              className={`rounded-xl p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all select-none ${adminCardClass}`}
              style={{
                ...cardStyle,
                opacity: block.visible ? 1 : 0.45,
                border: '1px solid rgba(207,168,71,0.18)',
              }}
            >
              {/* Drag handle */}
              <span className="text-[18px] flex-shrink-0 cursor-grab" style={{ color: 'rgba(207,168,71,0.5)' }}>
                ⠿
              </span>

              {/* Order badge */}
              <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(207,168,71,0.12)', color: 'var(--crm-gold,#CFA847)' }}>
                {idx + 1}
              </span>

              {/* Block info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold admin-text">{block.label}</p>
                <p className="text-[10px] admin-text-faint font-mono">{block.id}</p>
              </div>

              {/* Variant selector */}
              <select
                className="text-xs rounded-lg px-2 py-1 flex-shrink-0"
                style={{
                  background: 'rgba(78,11,31,0.3)',
                  border: '1px solid rgba(207,168,71,0.2)',
                  color: 'rgba(245,237,216,0.7)',
                  maxWidth: 130,
                }}
                value={block.variant}
                onChange={e => changeVariant(idx, e.target.value)}
              >
                {getVariants(block.id).map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>

              {/* Toggle visible */}
              <button
                type="button"
                onClick={() => toggleVisible(idx)}
                className="flex-shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-all"
                style={{
                  background: block.visible ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  border: block.visible ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
                  color: block.visible ? '#4ade80' : '#f87171',
                }}
              >
                {block.visible ? '● Видим' : '○ Скрит'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="btn-crimson text-sm px-5 py-2"
        >
          {saving ? 'Записване...' : 'Запази промените'}
        </button>
        <button
          type="button"
          onClick={() => load(pageSlug)}
          disabled={loading}
          className="btn-ghost text-sm px-4 py-2"
        >
          Върни
        </button>
        {msg && (
          <p className="text-xs font-medium" style={{
            color: msg.startsWith('✓') ? 'var(--crm-gold,#CFA847)' : '#f87171',
          }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}
