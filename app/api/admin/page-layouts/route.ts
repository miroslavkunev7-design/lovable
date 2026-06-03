import { NextRequest, NextResponse } from 'next/server'
import { execute, isDbConfigured, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Липсва slug' }, { status: 400 })

  if (!isDbConfigured()) return NextResponse.json({ blocks: [] })

  const row = await queryOne<{ layout_config: unknown }>(
    `SELECT layout_config FROM page_layouts WHERE page_slug = ?`,
    [slug]
  )

  return NextResponse.json({ blocks: row?.layout_config ?? [] })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Само администратор' }, { status: 403 })
  }

  const body = await req.json()
  const { slug, blocks } = body as { slug: string; blocks: unknown[] }

  if (!slug || !Array.isArray(blocks)) {
    return NextResponse.json({ error: 'Невалидни данни' }, { status: 400 })
  }

  if (!isDbConfigured()) return NextResponse.json({ success: true, local: true })

  await execute(
    `INSERT INTO page_layouts (page_slug, layout_config, updated_at)
     VALUES (?, ?::jsonb, NOW())
     ON CONFLICT (page_slug) DO UPDATE
       SET layout_config = EXCLUDED.layout_config,
           updated_at    = NOW()`,
    [slug, JSON.stringify(blocks)]
  )

  return NextResponse.json({ success: true })
}
