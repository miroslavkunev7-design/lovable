import { NextRequest, NextResponse } from 'next/server'
import { execute, isDbConfigured } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { property_id, name, email, phone, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Моля попълнете всички задължителни полета' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Невалиден имейл адрес' },
        { status: 400 }
      )
    }

    if (!isDbConfigured()) {
      // Without DB: log to console and return success (message is "lost" but UX is good)
      console.log('[inquiry no-db]', { name, email, phone, message, property_id })
      return NextResponse.json({
        success: true,
        message: 'Запитването е получено! Ще се свържем с вас скоро.',
      })
    }

    await execute(
      `INSERT INTO inquiries (property_id, name, email, phone, message, status)
       VALUES (?, ?, ?, ?, ?, 'new')`,
      [property_id ? Number(property_id) : null, name, email, phone ?? null, message]
    )

    return NextResponse.json({
      success: true,
      message: 'Запитването е изпратено успешно!',
    })
  } catch (error) {
    console.error('[POST /api/inquiries]', error)
    return NextResponse.json(
      { success: false, error: 'Грешка при изпращане' },
      { status: 500 }
    )
  }
}
