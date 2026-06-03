'use client'
import { useEffect, useState } from 'react'

export const CRM_THEMES = [
  {
    id: 'dark-crimson',
    label: 'Бордо & Злато',
    description: 'Луксозен мрамор с тъмночервен фон',
    preview: ['#4E0B1F', '#CFA847', '#FAF7F2'],
  },
  {
    id: 'dark-navy',
    label: 'Тъмносиньо & Сребро',
    description: 'Морско синьо с сребристи акценти',
    preview: ['#0B1F4E', '#8BAED4', '#EEF2F8'],
  },
  {
    id: 'dark-emerald',
    label: 'Изумруд & Злато',
    description: 'Тъмнозелено с топли акценти',
    preview: ['#0B3D20', '#CFA847', '#F0FAF4'],
  },
  {
    id: 'obsidian',
    label: 'Обсидиан & Злато',
    description: 'Чисто черно с неоново злато',
    preview: ['#111111', '#D4AF37', '#F5F5F5'],
  },
  {
    id: 'warm-ivory',
    label: 'Слонова кост (Светло)',
    description: 'Светъл мраморен фон, класически стил',
    preview: ['#F5EDE0', '#6B1428', '#3D1A0A'],
  },
] as const

export type CrmThemeId = typeof CRM_THEMES[number]['id']

export function applyTheme(themeId: CrmThemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-crm-theme', themeId)
  try { localStorage.setItem('crm_theme', themeId) } catch {}
}

export function loadStoredTheme() {
  if (typeof window === 'undefined') return 'dark-crimson' as CrmThemeId
  const stored = localStorage.getItem('crm_theme') as CrmThemeId | null
  return stored ?? 'dark-crimson' as CrmThemeId
}

interface Props {
  initialTheme?: string
  onSaved?: (theme: CrmThemeId) => void
}

export default function CrmThemePanel({ initialTheme = 'dark-crimson', onSaved }: Props) {
  const [selected, setSelected] = useState<CrmThemeId>(initialTheme as CrmThemeId)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const stored = loadStoredTheme()
    setSelected(stored)
    applyTheme(stored)
  }, [])

  async function save(id: CrmThemeId) {
    setSelected(id)
    applyTheme(id)
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crm_theme: id }),
      })
      const json = await res.json()
      setMsg(json.success ? 'Темата е запазена' : (json.error ?? 'Грешка'))
      if (json.success) onSaved?.(id)
    } catch {
      setMsg('Мрежова грешка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="text-xs admin-text-muted mb-3">
        Избери цветова схема за CRM панела — важи само за твоя акаунт.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CRM_THEMES.map(theme => (
          <button
            key={theme.id}
            type="button"
            onClick={() => save(theme.id)}
            disabled={saving}
            className="text-left rounded-xl p-3 transition-all"
            style={{
              border: selected === theme.id
                ? '2px solid var(--crm-gold, #CFA847)'
                : '1px solid rgba(207,168,71,0.18)',
              background: selected === theme.id
                ? 'rgba(207,168,71,0.08)'
                : 'rgba(78,11,31,0.15)',
              boxShadow: selected === theme.id
                ? '0 0 12px rgba(207,168,71,0.2)'
                : 'none',
            }}
          >
            {/* Color swatches */}
            <div className="flex gap-1 mb-2">
              {theme.preview.map((color, i) => (
                <div key={i} className="w-7 h-7 rounded-md flex-shrink-0"
                  style={{ background: color, border: '1px solid rgba(255,255,255,0.12)' }} />
              ))}
            </div>
            <p className="text-sm font-semibold admin-text leading-tight">{theme.label}</p>
            <p className="text-[10px] admin-text-faint mt-0.5">{theme.description}</p>
            {selected === theme.id && (
              <p className="text-[10px] font-semibold mt-1.5" style={{ color: 'var(--crm-gold, #CFA847)' }}>
                ✓ Активна
              </p>
            )}
          </button>
        ))}
      </div>
      {msg && (
        <p className="text-xs mt-3 font-medium" style={{ color: msg.includes('решка') ? '#f87171' : 'var(--crm-gold, #CFA847)' }}>
          {msg}
        </p>
      )}
    </div>
  )
}
