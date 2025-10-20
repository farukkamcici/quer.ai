import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const base = process.env.PYTHON_BACKEND_URL
  if (!base) {
    return NextResponse.json({ error: 'Backend is not configured (PYTHON_BACKEND_URL missing).' }, { status: 503 })
  }

  try {
    const res = await fetch(`${base}/api/chat/delete_all?user_id=${encodeURIComponent(user.id)}` , {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return NextResponse.json({ error: 'Backend error', detail }, { status: res.status })
    }
    return NextResponse.json({ deleted: true })
  } catch (e) {
    return NextResponse.json({ error: 'Backend unreachable', detail: String(e) }, { status: 502 })
  }
}

