import { NextRequest, NextResponse } from 'next/server'
import { execute, isDbConfigured, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isDbConfigured()) {
    return NextResponse.json({ crm_theme: 'dark-crimson', cover_url: null })
  }

  const row = await queryOne<{ crm_theme: string; cover_url: string | null }>(
    `SELECT crm_theme, cover_url FROM user_preferences WHERE user_id = ?`,
    [session.id]
  )

  return NextResponse.json({
    crm_theme: row?.crm_theme ?? 'dark-crimson',
    cover_url: row?.cover_url ?? null,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const crm_theme = typeof body.crm_theme === 'string' ? body.crm_theme : undefined
  const cover_url = typeof body.cover_url === 'string' ? body.cover_url : undefined

  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, local: true })
  }

  const existing = await queryOne(
    `SELECT user_id FROM user_preferences WHERE user_id = ?`,
    [session.id]
  )

  if (existing) {
    const fields: string[] = []
    const vals: (string | null | number)[] = []
    if (crm_theme !== undefined) { fields.push('crm_theme = ?'); vals.push(crm_theme) }
    if (cover_url !== undefined) { fields.push('cover_url = ?'); vals.push(cover_url) }
    if (fields.length) {
      fields.push('updated_at = NOW()')
      vals.push(session.id)
      await execute(`UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`, vals)
    }
  } else {
    await execute(
      `INSERT INTO user_preferences (user_id, crm_theme, cover_url)
       VALUES (?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE
         SET crm_theme = EXCLUDED.crm_theme,
             cover_url = EXCLUDED.cover_url,
             updated_at = NOW()`,
      [session.id, crm_theme ?? 'dark-crimson', cover_url ?? null]
    )
  }

  return NextResponse.json({ success: true })
}
