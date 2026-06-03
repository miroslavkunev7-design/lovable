'use client'
import { useEffect } from 'react'
import { applyTheme, loadStoredTheme, type CrmThemeId } from '@/components/admin/CrmThemePanel'

export default function CrmThemeLoader() {
  useEffect(() => {
    // 1. Apply stored theme immediately (no flash)
    const stored = loadStoredTheme()
    applyTheme(stored)

    // 2. Fetch from server and sync in background
    fetch('/api/admin/preferences')
      .then(r => r.json())
      .then(json => {
        if (json.crm_theme && json.crm_theme !== stored) {
          applyTheme(json.crm_theme as CrmThemeId)
          try { localStorage.setItem('crm_theme', json.crm_theme) } catch {}
        }

        // Apply custom cover image if set
        if (json.cover_url) {
          const root = document.querySelector('.admin-marble-bg') as HTMLElement | null
          if (root) {
            root.style.backgroundImage = `url('${json.cover_url}'), ${getComputedStyle(root).backgroundImage}`
            root.style.backgroundBlendMode = 'overlay'
          }
        }
      })
      .catch(() => {})
  }, [])

  return null
}
