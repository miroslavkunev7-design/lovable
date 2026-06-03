'use client'

import { useEffect, useRef, useState } from 'react'
import CrmThemePanel, { applyTheme, type CrmThemeId } from '@/components/admin/CrmThemePanel'
import { adminCardClass, cardStyle } from '@/components/admin/AdminCard'

interface Stats {
  clients: number
  active_clients: number
  properties: number
  tasks_done: number
  deals: number
}

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [role, setRole] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'theme'>('profile')

  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.user) {
          setName(json.user.name ?? '')
          setEmail(json.user.email ?? '')
          setPhone(json.user.phone ?? '')
          setAvatarUrl(json.user.avatar_url ?? null)
          setRole(json.user.role ?? '')
          setStats(json.stats ?? null)
        }
      })

    fetch('/api/admin/preferences')
      .then(r => r.json())
      .then(json => {
        if (json.crm_theme) applyTheme(json.crm_theme as CrmThemeId)
        if (json.cover_url) setCoverUrl(json.cover_url)
      })
      .catch(() => {})
  }, [])

  async function uploadToCloudinary(file: File): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'djh3tkfuu'
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default'
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', preset)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) throw new Error(`Cloudinary HTTP ${res.status}`)
    const json = await res.json() as { secure_url?: string; error?: { message?: string } }
    if (!json.secure_url) throw new Error(json.error?.message ?? 'Cloudinary не върна URL')
    return json.secure_url
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setMessage('')
    try {
      const url = await uploadToCloudinary(file)
      const res = await fetch('/api/admin/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: url }),
      })
      const json = await res.json()
      if (json.success) { setAvatarUrl(url); setMessage('Аватарът е обновен ✓') }
      else setMessage(json.error ?? 'Грешка при запис')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Грешка при качване')
    } finally {
      setUploadingAvatar(false)
      if (avatarRef.current) avatarRef.current.value = ''
    }
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    setMessage('')
    try {
      const url = await uploadToCloudinary(file)
      const res = await fetch('/api/admin/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_url: url }),
      })
      const json = await res.json()
      if (json.success) { setCoverUrl(url); setMessage('Снимката за CRM фон е обновена ✓') }
      else setMessage(json.error ?? 'Грешка при запис')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Грешка при качване')
    } finally {
      setUploadingCover(false)
      if (coverRef.current) coverRef.current.value = ''
    }
  }

  async function saveProfile() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const json = await res.json()
      setMessage(json.success ? 'Профилът е запазен ✓' : (json.error ?? 'Грешка'))
    } finally {
      setSaving(false)
    }
  }

  const TABS = [
    { id: 'profile', label: '👤 Профил' },
    { id: 'theme',   label: '🎨 Тема на CRM' },
  ] as const

  return (
    <div className="max-w-[720px]">
      <h1 className="font-display text-white text-2xl font-bold mb-6">Моят профил</h1>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: '1px solid rgba(207,168,71,0.2)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className="flex-1 py-2.5 text-sm font-medium transition-all"
            style={{
              background: activeTab === t.id ? 'rgba(207,168,71,0.1)' : 'transparent',
              color: activeTab === t.id ? 'var(--crm-gold,#CFA847)' : 'rgba(245,237,216,0.45)',
              borderBottom: activeTab === t.id ? '2px solid var(--crm-gold,#CFA847)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className={`${adminCardClass} p-6 rounded-2xl mb-5`} style={cardStyle}>
          {/* Avatar + cover row */}
          <div className="flex items-start gap-5 mb-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Аватар" className="w-20 h-20 rounded-full object-cover"
                  style={{ border: '2px solid rgba(207,168,71,0.4)' }} />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: 'rgba(78,11,31,0.7)', border: '2px solid rgba(207,168,71,0.3)' }}>
                  {name.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ background: 'var(--crm-gold,#CFA847)', color: '#fff' }}
                title="Смени аватара"
              >
                {uploadingAvatar ? '…' : '✎'}
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>

            {/* Name + role */}
            <div className="flex-1">
              <p className="text-white font-semibold text-lg">{name || 'Потребител'}</p>
              <p className="text-sm admin-text-muted">
                {role === 'admin' ? '⭐ Администратор' : '🏠 Брокер'}
              </p>

              {/* Cover image upload */}
              <div className="mt-3">
                <p className="text-[10px] admin-text-faint uppercase tracking-wide mb-1">CRM фон снимка</p>
                <div className="flex items-center gap-2">
                  {coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="CRM фон" className="w-14 h-10 rounded-lg object-cover"
                      style={{ border: '1px solid rgba(207,168,71,0.3)' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => coverRef.current?.click()}
                    disabled={uploadingCover}
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    {uploadingCover ? 'Качване...' : coverUrl ? 'Смени фона' : 'Качи фонова снимка'}
                  </button>
                  {coverUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch('/api/admin/preferences', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ cover_url: '' }),
                        })
                        setCoverUrl(null)
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      × Премахни
                    </button>
                  )}
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
                </div>
                <p className="text-[10px] admin-text-faint mt-1">
                  Снимката се показва като декоративен фон само в твоя CRM изглед.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && role !== 'admin' && (
            <div className="grid grid-cols-5 gap-2 mb-6">
              {[
                { label: 'Клиенти', value: stats.clients },
                { label: 'Активни', value: stats.active_clients },
                { label: 'Имоти', value: stats.properties },
                { label: 'Задачи ✓', value: stats.tasks_done },
                { label: 'Сделки', value: stats.deals },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-lg"
                  style={{ background: 'rgba(207,168,71,0.07)', border: '1px solid rgba(207,168,71,0.15)' }}>
                  <p className="text-xl font-bold font-display" style={{ color: 'var(--crm-gold,#CFA847)' }}>{s.value}</p>
                  <p className="text-[10px] admin-text-faint">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <input className="input-dark" placeholder="Пълно име" value={name} onChange={e => setName(e.target.value)} />
            <input className="input-dark opacity-50 cursor-not-allowed" placeholder="Имейл" value={email} disabled />
            <input className="input-dark" placeholder="Телефон" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          {message && (
            <p className="text-sm mb-3 font-medium" style={{
              color: message.includes('✓') ? 'var(--crm-gold,#CFA847)' : '#f87171',
            }}>
              {message}
            </p>
          )}

          <button onClick={saveProfile} disabled={saving} className="btn-crimson text-sm px-5 py-2">
            {saving ? 'Запис...' : 'Запази профила'}
          </button>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className={`${adminCardClass} p-6 rounded-2xl`} style={cardStyle}>
          <h2 className="font-display text-white font-semibold mb-1">Цветова схема на CRM</h2>
          <p className="text-xs admin-text-muted mb-5">
            Избери стил — важи само за твоя акаунт, другите потребители имат своя избор.
          </p>
          <CrmThemePanel />
        </div>
      )}
    </div>
  )
}
