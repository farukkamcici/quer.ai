import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(_request, { params }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chatId = params?.id
  if (!chatId) {
    return NextResponse.json({ error: 'Missing chat id' }, { status: 400 })
  }

  const base = process.env.PYTHON_BACKEND_URL
  if (!base) {
    return NextResponse.json({ error: 'Backend is not configured (PYTHON_BACKEND_URL missing).' }, { status: 503 })
  }

  try {
    const res = await fetch(`${base}/api/chat/${encodeURIComponent(chatId)}?user_id=${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ error: data?.detail || 'Backend error', detail: data }, { status: res.status })
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Backend unreachable', detail: String(e) }, { status: 502 })
  }
}
